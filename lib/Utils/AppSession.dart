import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:android/Models/backend_models.dart';

class User {
  const User({
    this.id,
    this.name,
    this.email,
    this.phone,
    this.gender,
    this.avatarUrl,
  });

  final String? id;
  final String? name;
  final String? email;
  final String? phone;
  final String? gender;
  final String? avatarUrl;

  factory User.fromSessionModel(SessionUserModel model) {

    return User(
      id: model.id,
      name: model.username,
      email: model.email,
      phone: model.phone,
      avatarUrl: model.avatar,
      gender: _mapGender(model.gender),
    );
  }

  User copyWith({
    String? id,
    String? name,
    String? email,
    String? phone,
    String? birthday,
    String? gender,
    String? avatarUrl,
  }) {
    if (gender != null && gender != 'Nam' && gender != 'Nữ') {
      throw Exception('Giới tính phải là "Nam" hoặc "Nữ"');
    }

    return User(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      gender: gender ?? this.gender,
      avatarUrl: avatarUrl ?? this.avatarUrl,
    );
  }

  static const List<String> genderOptions = ['Nam', 'Nữ'];

  static String? _mapGender(String? gender) {
    if (gender == null) return null;
    switch (gender.toUpperCase()) {
      case 'MALE':
        return 'Nam';
      case 'FEMALE':
        return 'Nữ';
      default:
        return null;
    }
  }

  static String? mapGenderToBackend(String? gender) {
    if (gender == null) return null;
    if (gender == 'Nam') return 'MALE';
    if (gender == 'Nữ') return 'FEMALE';
    return null;
  }
}

class Booking {
  Booking({
    required this.branch,
    required this.date,
    required this.time,
    required this.guestCount,
    this.branchId,
    this.tableId,
    this.tableCode,
    this.area,
    this.tableDescription,
    this.specialRequest,
    this.durationMinutes = 120,
  });

  final String branch;
  final String? branchId;
  final DateTime date;
  final TimeOfDay time;
  final int guestCount;
  final String? tableId;
  final String? tableCode;
  final String? area;
  final String? tableDescription;
  final String? specialRequest;
  final int durationMinutes;

  DateTime get reservedDateTime => DateTime(
        date.year,
        date.month,
        date.day,
        time.hour,
        time.minute,
      );

  Booking copyWith({
    String? branch,
    String? branchId,
    DateTime? date,
    TimeOfDay? time,
    int? guestCount,
    String? tableId,
    String? tableCode,
    String? area,
    String? tableDescription,
    String? specialRequest,
    int? durationMinutes,
  }) {
    return Booking(
      branch: branch ?? this.branch,
      branchId: branchId ?? this.branchId,
      date: date ?? this.date,
      time: time ?? this.time,
      guestCount: guestCount ?? this.guestCount,
      tableId: tableId ?? this.tableId,
      tableCode: tableCode ?? this.tableCode,
      area: area ?? this.area,
      tableDescription: tableDescription ?? this.tableDescription,
      specialRequest: specialRequest ?? this.specialRequest,
      durationMinutes: durationMinutes ?? this.durationMinutes,
    );
  }
}

class AppSession {
  static final ValueNotifier<User?> currentUser = ValueNotifier<User?>(null);
  static bool get isLoggedIn => currentUser.value != null;

  static final ValueNotifier<Booking?> currentBooking =
      ValueNotifier<Booking?>(null);
  static bool get hasBooking => currentBooking.value != null;

  static String? _accessToken;
  static String? _refreshToken;

  static String? get accessToken => _accessToken;
  static String? get refreshToken => _refreshToken;

  static Future<bool> loginMock(String email, String password) async {
    await Future.delayed(const Duration(seconds: 1));
    if (email == 'admin' && password == '123') {
      setAuthSession(
        user: const User(
          id: 'mock-admin',
          name: 'Admin',
          email: 'admin@example.com',
          phone: '0123456789',
          gender: 'Nam',
        ),
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh',
      );
      return true;
    }
    return false;
  }

  static const _keyUser = 'session_user';
  static const _keyAccess = 'session_access';
  static const _keyRefresh = 'session_refresh';

  static Future<void> loadPersistedSession() async {
    final prefs = await SharedPreferences.getInstance();
    final access = prefs.getString(_keyAccess);
    final refresh = prefs.getString(_keyRefresh);
    final userJson = prefs.getString(_keyUser);
    if (access != null && refresh != null && userJson != null) {
      try {
        final map = jsonDecode(userJson) as Map<String, dynamic>;
        final user = User(
          id: map['id'] as String?,
          name: map['name'] as String?,
          email: map['email'] as String?,
          phone: map['phone'] as String?,
          avatarUrl: map['avatarUrl'] as String?,
          gender: map['gender'] as String?,
        );
        currentUser.value = user;
        _accessToken = access;
        _refreshToken = refresh;
      } catch (_) {
        await _clearPersisted();
      }
    }
  }

  static Future<void> _persistSession() async {
    final prefs = await SharedPreferences.getInstance();
    final user = currentUser.value;
    if (user == null || _accessToken == null || _refreshToken == null) {
      await _clearPersisted();
      return;
    }
    final map = {
      'id': user.id,
      'name': user.name,
      'email': user.email,
      'phone': user.phone,
      'avatarUrl': user.avatarUrl,
      'gender': user.gender,
    };
    await prefs.setString(_keyUser, jsonEncode(map));
    await prefs.setString(_keyAccess, _accessToken!);
    await prefs.setString(_keyRefresh, _refreshToken!);
  }

  static Future<void> _clearPersisted() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyUser);
    await prefs.remove(_keyAccess);
    await prefs.remove(_keyRefresh);
  }

  static void setAuthSession({
    required User user,
    required String accessToken,
    required String refreshToken,
  }) {
    currentUser.value = user;
    _accessToken = accessToken;
    _refreshToken = refreshToken;
    _persistSession();
  }

  static void signOut() {
    currentUser.value = null;
    currentBooking.value = null;
    _accessToken = null;
    _refreshToken = null;
    _clearPersisted();
  }

  static void setBooking(Booking booking) {
    currentBooking.value = booking;
  }

  static void clearBooking() {
    currentBooking.value = null;
  }
}

