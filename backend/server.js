const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Kết nối MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Ket nối MongoDB Atlas thành công!"))
  .catch((err) => console.error("Lỗi kết nối MongoDB:", err));

// Định nghĩa Schema và Model nhân viên
const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  gender: { type: String },
  dateOfBirth: { type: String },
  department: { type: String },
  position: { type: String },
  email: { type: String, required: true },
  phone: { type: String },
  hireDate: { type: String },
  status: { type: String, default: "Đang làm việc" }
}, { collection: "employees" });

const Employee = mongoose.model("Employee", employeeSchema);

// Endpoint kiểm tra trạng thái
app.get("/health", (req, res) => {
  res.status(200).json({ message: "Backend đang hoạt động" });
});

// 1. Lấy danh sách & Tìm kiếm (?search=...)
app.get("/api/employees", async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query = {
        $or: [
          { employeeId: { $regex: search, $options: "i" } },
          { fullName: { $regex: search, $options: "i" } }
        ]
      };
    }
    const employees = await Employee.find(query);
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// 2. Lấy thông tin một nhân viên theo ID
app.get("/api/employees/:id", async (req, res) => {
  try {
    const employee = await Employee.findOne({
      $or: [
        { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
        { employeeId: req.params.id }
      ]
    });
    if (!employee) return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    res.status(200).json(employee);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// 3. Thêm nhân viên mới
app.post("/api/employees", async (req, res) => {
  try {
    const newEmployee = new Employee(req.body);
    const savedEmployee = await newEmployee.save();
    res.status(201).json(savedEmployee);
  } catch (error) {
    res.status(400).json({ message: "Lỗi dữ liệu hoặc trùng mã nhân viên", error: error.message });
  }
});

// 4. Cập nhật nhân viên
app.put("/api/employees/:id", async (req, res) => {
  try {
    const updatedEmployee = await Employee.findOneAndUpdate(
      { $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { employeeId: req.params.id }] },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedEmployee) return res.status(404).json({ message: "Không tìm thấy nhân viên để cập nhật" });
    res.status(200).json(updatedEmployee);
  } catch (error) {
    res.status(400).json({ message: "Lỗi cập nhật", error: error.message });
  }
});

// 5. Xóa nhân viên
app.delete("/api/employees/:id", async (req, res) => {
  try {
    const deletedEmployee = await Employee.findOneAndDelete(
      { $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { employeeId: req.params.id }] }
    );
    if (!deletedEmployee) return res.status(404).json({ message: "Không tìm thấy nhân viên để xóa" });
    res.status(200).json({ message: "Xóa nhân viên thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chay tai cong ${PORT}`);
});