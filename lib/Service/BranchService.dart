import '../Models/BranchModels.dart';
import '../Repository/BranchRepository.dart';

class BranchService {
  late BranchRepository branchRepository;

  BranchService() {
    branchRepository = BranchRepository();
  }

  Future<BranchListResponse> getBranches() async {
    return await branchRepository.getBranches();
  }
}
