#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    int n;
    std::cin >> n;
    std::vector<int> arr(n);
    for (int i = 0; i < n; ++i) std::cin >> arr[i];
    std::sort(arr.begin(), arr.end());
    for (int i = 0; i < n; ++i) {
        if (i) std::cout << " ";
        std::cout << arr[i];
    }
    std::cout << "\n";
    return 0;
}
