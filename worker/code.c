#include <stdio.h>
#include <stdlib.h>

int cmp(const void *a, const void *b) {
    return (*(const int *)a - *(const int *)b);
}

int main(void) {
    int n;
    if (scanf("%d", &n) != 1) return 1;
    int arr[128];
    for (int i = 0; i < n; ++i) scanf("%d", &arr[i]);
    qsort(arr, n, sizeof(int), cmp);
    for (int i = 0; i < n; ++i) {
        if (i) printf(" ");
        printf("%d", arr[i]);
    }
    printf("\n");
    return 0;
}
