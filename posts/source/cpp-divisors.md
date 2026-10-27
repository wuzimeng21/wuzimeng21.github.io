---
title: "约数试除法C++"
created: "2026-10-27"
published: "2026-01-18"
source: "https://blog.csdn.net/2201_76119663/article/details/157094015"
category: "算法与C++"
---

# 约数试除法C++

```
#include <iostream>
#include <cstring>
#include <algorithm>
#include <vector>
#include <cmath>

using namespace std;

int n;

int main()
{
    cin >> n;
    for(int i = 0; i < n; i ++) {
         int b = 0 ;
         vector<int> a;
         cin >> b;
         for(int j = 1; j <= b / j; j ++) {
             if(b % j == 0) {
                 a.push_back(j);
                 if(b / j != j)  a.push_back(b / j);
             }
         }
         sort(a.begin(), a.end());
         for(int j = 0; j < a.size(); j ++) cout << a[j] << " ";
         cout << endl;
    }
    return 0;
}
```
