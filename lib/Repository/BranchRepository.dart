import '../Models/BranchModels.dart';
import '../Utils/Utils.dart';
import 'HttpRepository.dart';

class BranchRepository extends HttpRepository {
  Future<BranchListResponse> getBranches() async {
    final json = await getJson(Utils.branchesApi);
    final res = BranchListResponse.fromJson(json);
    if (!res.status) {
      throw Exception(res.message);
    }
    return res;
  }
}
