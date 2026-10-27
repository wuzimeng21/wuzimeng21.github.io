---
title: "【Daily Code】leetcode 154. 寻找旋转排序数组中的最小值 II"
created: "2026-10-27"
published: "2026-05-16"
source: "https://blog.csdn.net/2201_76119663/article/details/161135036"
category: "算法与C++"
---

# 【Daily Code】leetcode 154. 寻找旋转排序数组中的最小值 II

```cpp
class Solution {
public:
    int findMin(vector<int>& nums) {
        int n = nums.size();
        int r = n - 1, l = 0;
        int mid = (r + l) >> 1;
        if(nums[mid] > nums[r]) {
            l = mid;
        }
        else if(nums[mid] < nums[r]) {
            r = mid;
        }
        // int idx = l;
        while(l < r) {
            if(nums[l] <= nums[l + 1]) l ++;
            else {
                // idx = l;
                // cout << "l..." <<endl;
                return nums[l + 1];
            }
            if(nums[r] >= nums[r - 1]) r --;
            else {
                // idx = r;
                // cout << "r..." <<endl;
                return nums[r];
            }

        }
        return nums[0];
    }
};
```
