---
title: "leetGPU"
created: "2026-10-27"
published: "2026-05-16"
source: "https://blog.csdn.net/2201_76119663/article/details/161147247"
category: "GPU与性能"
---

# leetGPU

1. **加粗样式**:
```
#include <cuda_runtime.h>

__global__ void vector_add(const float* A, const float* B, float* C, int N) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if(idx < N) {
        C[idx] = A[idx] + B[idx];
    }
}

// A, B, C are device pointers (i.e. pointers to memory on the GPU)
extern "C" void solve(const float* A, const float* B, float* C, int N) {
    int threadsPerBlock = 256;
    int blocksPerGrid = (N + threadsPerBlock - 1) / threadsPerBlock;

    vector_add<<<blocksPerGrid, threadsPerBlock>>>(A, B, C, N);
    cudaDeviceSynchronize();
}
```
2. 2:
```
#include <cuda_runtime.h>

/// 矩阵乘法 kernel（naive 实现）
/// A: M × N,  B: N × K,  C: M × K,  全部行主序存储
/// 每个线程计算 C 的一个元素
__global__ void matrix_multiplication_kernel(const float* A, const float* B, float* C, int M, int N,
                                             int K) {
    // 当前线程负责 C[row][col]
    int row = blockIdx.y * blockDim.y + threadIdx.y;
    int col = blockIdx.x * blockDim.x + threadIdx.x;

    // 边界检查
    if (row < M && col < K) {
        float sum = 0.0f;

        // 沿共享维度 N 做内积: A 的第 row 行 × B 的第 col 列
        for (int n = 0; n < N; n++) {
            sum += A[row * N + n] * B[n * K + col];
        }

        C[row * K + col] = sum;
    }
}

/// solve 函数
/// A, B, C 已经是 GPU 上的指针，无需 cudaMalloc/cudaMemcpy
extern "C" void solve(const float* A, const float* B, float* C, int M, int N, int K) {
    // 2D block: 16×16 = 256 线程（32 的倍数，occupancy 友好）
    dim3 threadsPerBlock(16, 16);

    // 2D grid: 按 K（宽）和 M（高）覆盖整个输出矩阵
    dim3 blocksPerGrid((K + threadsPerBlock.x - 1) / threadsPerBlock.x,
                       (M + threadsPerBlock.y - 1) / threadsPerBlock.y);

    // Launch kernel
    matrix_multiplication_kernel<<<blocksPerGrid, threadsPerBlock>>>(A, B, C, M, N, K);

    // 等待 GPU 执行完毕
    cudaDeviceSynchronize();
}
```
3. 3:
```
#include <cuda_runtime.h>

__global__ void matrix_transpose_kernel(const float* input, float* output, int rows, int cols) {
    int row = blockIdx.y * blockDim.y + threadIdx.y;
    int col = blockIdx.x * blockDim.x + threadIdx.x;
    if(row < rows && col < cols) {
        output[col * rows + row] = input[row *cols + col];
    }
}

// input, output are device pointers (i.e. pointers to memory on the GPU)
extern "C" void solve(const float* input, float* output, int rows, int cols) {
    dim3 threadsPerBlock(16, 16);
    dim3 blocksPerGrid((cols + threadsPerBlock.x - 1) / threadsPerBlock.x,
                       (rows + threadsPerBlock.y - 1) / threadsPerBlock.y);

    matrix_transpose_kernel<<<blocksPerGrid, threadsPerBlock>>>(input, output, rows, cols);
    cudaDeviceSynchronize();
}
```
4. 4:
```
#include <cuda_runtime.h>

__global__ void invert_kernel(unsigned char* image, int width, int height) {
    int idx = blockIdx.x * blockDim.x +threadIdx.x;
    if(idx < width * height) {
        uchar4 * pixel = (uchar4 *)(image + idx * 4);
        uchar4 p = *pixel;
        p.x = 255 - p.x;
        p.y = 255 - p.y;
        p.z = 255 - p.z;
        *pixel = p;
        
    }
}
// image_input, image_output are device pointers (i.e. pointers to memory on the GPU)
extern "C" void solve(unsigned char* image, int width, int height) {
    int threadsPerBlock = 256;
    int blocksPerGrid = (width * height + threadsPerBlock - 1) / threadsPerBlock;

    invert_kernel<<<blocksPerGrid, threadsPerBlock>>>(image, width, height);
    cudaDeviceSynchronize();
}
```
5. 5:
```
#include <cuda_runtime.h>

__global__ void matrix_add(const float* A, const float* B, float* C, int N) {
    // int row = blockIdx.y * blockDim.y + threadIdx.y;
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if(idx < N * N) {
        C[idx] = (A[idx] + B[idx]);
    }
}

// A, B, C are device pointers (i.e. pointers to memory on the GPU)
extern "C" void solve(const float* A, const float* B, float* C, int N) {
    int threadsPerBlock = 256;
    int blocksPerGrid = (N * N + threadsPerBlock - 1) / threadsPerBlock;

    matrix_add<<<blocksPerGrid, threadsPerBlock>>>(A, B, C, N);
    cudaDeviceSynchronize();
}
```
6. 6:
```
#include <cuda_runtime.h>

__global__ void convolution_1d_kernel(const float* input, const float* kernel, float* output,
                                      int input_size, int kernel_size) {
                                        int idx1 = blockIdx.x * blockDim.x + threadIdx.x;
                                        if(idx1 <  input_size - kernel_size + 1 ) {
                                            float t = 0.0f;
                                            for(int idx2 = 0; idx2 <= kernel_size - 1; idx2 ++){
                                                t += input[idx1 + idx2] * kernel[idx2];
                                            }
                                            output[idx1] = t;

                                        } 
                                      }

// input, kernel, output are device pointers (i.e. pointers to memory on the GPU)
extern "C" void solve(const float* input, const float* kernel, float* output, int input_size,
                      int kernel_size) {
    int output_size = input_size - kernel_size + 1;
    int threadsPerBlock = 256;
    int blocksPerGrid = (output_size + threadsPerBlock - 1) / threadsPerBlock;

    convolution_1d_kernel<<<blocksPerGrid, threadsPerBlock>>>(input, kernel, output, input_size,
                                                              kernel_size);
    cudaDeviceSynchronize();
}
```
7. 7:
```
#include <cuda_runtime.h>

__global__ void reverse_array(float* input, int N) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if(idx < N / 2) {
        int t = input[idx];
        input[idx] = input[N - idx - 1];
        input[N - idx - 1] = t;
    }
}

// input is device pointer
extern "C" void solve(float* input, int N) {
    int threadsPerBlock = 256;
    int blocksPerGrid = (N + threadsPerBlock - 1) / threadsPerBlock;

    reverse_array<<<blocksPerGrid, threadsPerBlock>>>(input, N);
    cudaDeviceSynchronize();
}
```
8. 8
