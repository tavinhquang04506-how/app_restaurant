import 'package:flutter/material.dart';
import 'package:android/Utils/AppSession.dart';
import 'package:android/Utils/Utils.dart';
import 'package:android/Service/MeService.dart';

class PersonalInformationPage extends StatefulWidget {
  const PersonalInformationPage({super.key});

  @override
  State<PersonalInformationPage> createState() => _PersonalInformationPageState();
}

class _PersonalInformationPageState extends State<PersonalInformationPage> {
  final _formKey = GlobalKey<FormState>();
  final MeService _meService = MeService();

  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _emailController;

  String? _selectedGender;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _initData();
  }

  Future<void> _initData() async {
    final user = AppSession.currentUser.value;
    _nameController = TextEditingController(text: user?.name ?? '');
    _phoneController = TextEditingController(text: user?.phone ?? '');
    _emailController = TextEditingController(text: user?.email ?? '');
    _selectedGender = user?.gender;

    try {
      setState(() => _loading = true);
      final res = await _meService.getMe();
      final mappedUser = User.fromSessionModel(res.data!);
      AppSession.currentUser.value = mappedUser;
      _nameController.text = mappedUser.name ?? '';
      _phoneController.text = mappedUser.phone ?? '';
      _emailController.text = mappedUser.email ?? '';
      _selectedGender = mappedUser.gender;
    } catch (_) {
      // ignore fetch error, keep existing cached data
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = AppSession.currentUser.value;

    return Scaffold(
      backgroundColor: const Color(0xFF2A0E0E),
      appBar: AppBar(
        backgroundColor: const Color(0xFF2A0E0E),
        title: const Text(
          "Thông tin cá nhân",
          style: TextStyle(color: Colors.white),
        ),
        centerTitle: true,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              // Avatar
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.redAccent, width: 3),
                  color: Colors.white12,
                ),
                child: user?.avatarUrl != null
                    ? ClipOval(child: Image.network(user!.avatarUrl!, fit: BoxFit.cover))
                    : const Icon(Icons.person, size: 60, color: Colors.white70),
              ),
              const SizedBox(height: 12),
              Text(
                user?.name ?? "Người dùng",
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 24),

              // Họ và tên
              _buildTextField(label: "Họ và tên", controller: _nameController),
              const SizedBox(height: 12),

              // Số điện thoại
              _buildTextField(
                label: "Số điện thoại",
                controller: _phoneController,
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 12),

              // Email
              _buildTextField(
                label: "Email",
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                readOnly: true,
              ),
              const SizedBox(height: 12),

              // Giới tính
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF3A1B1B),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: DropdownButtonFormField<String>(
                  initialValue: _selectedGender,
                  decoration: const InputDecoration(
                    border: InputBorder.none,
                    labelText: "Giới tính",
                    labelStyle: TextStyle(color: Colors.white70),
                  ),
                  dropdownColor: const Color(0xFF3A1B1B),
                  style: const TextStyle(color: Colors.white),
                  items: User.genderOptions
                      .map((gender) => DropdownMenuItem(
                    value: gender,
                    child: Text(gender),
                  ))
                      .toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedGender = value;
                    });
                  },
                ),
              ),
              const SizedBox(height: 24),

              // Lưu thay đổi
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: _loading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.redAccent,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                  ),
                  child: _loading
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          "Lưu thay đổi",
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final res = await _meService.updateMe(
        username: _nameController.text.trim(),
        phone: _phoneController.text.trim(),
        avatarUrl: AppSession.currentUser.value?.avatarUrl,
        gender: User.mapGenderToBackend(_selectedGender),
      );
      final mappedUser = User.fromSessionModel(res.data!);
      AppSession.currentUser.value = mappedUser.copyWith(
        gender: _selectedGender,
      );
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Lưu thông tin thành công')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Cập nhật thất bại: ${extractErrorMessage(e)}')),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  Widget _buildTextField({
    required String label,
    required TextEditingController controller,
    String? hintText,
    TextInputType keyboardType = TextInputType.text,
    bool readOnly = false,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      readOnly: readOnly,
      enableInteractiveSelection: true,
      enableSuggestions: true,
      autocorrect: true,
      textCapitalization: keyboardType == TextInputType.name 
          ? TextCapitalization.words 
          : TextCapitalization.none,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        labelText: label,
        hintText: hintText,
        labelStyle: const TextStyle(color: Colors.white70),
        hintStyle: const TextStyle(color: Colors.white54),
        filled: true,
        fillColor: const Color(0xFF3A1B1B),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
      ),
      validator: (value) {
        if (value == null || value.isEmpty) {
          return 'Vui lòng nhập $label';
        }
        return null;
      },
    );
  }
}
