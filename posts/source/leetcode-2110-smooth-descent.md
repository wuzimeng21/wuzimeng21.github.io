---
title: "【Daily Code】leetcode 2110.股票平滑下跌阶段的数目"
created: "2026-10-27"
published: "2026-05-13"
source: "https://blog.csdn.net/2201_76119663/article/details/161027739"
category: "算法与C++"
---

# 【Daily Code】leetcode 2110.股票平滑下跌阶段的数目

```cpp
class Solution {
public:
    long long getDescentPeriods(vector<int>& prices) {
        vector<int> nums;
        int n = prices.size();
        for(int i = 1 ; i < n; i ++) {
            int t = 1;
            bool flag = false;
            while(t < n && i < n && prices[i] + 1 == prices[i - 1]) {
                // std::cout << "i: " << i << std::endl;
                t ++, i ++;
                flag = true;
            }
            // i += t;
            // i ++;
            if(flag) {
                nums.push_back(t);
                // std::cout << t << std::endl;
            }
        }
        long long res = n;
        if(nums.size() == 0) return res;
        for( auto x: nums) {
            res  += 1LL *(0.5 * x * (x - 1));
        }
        return res;
    }
};
```
