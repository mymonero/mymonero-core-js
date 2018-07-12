#include <stdio.h>
#include <emscripten/bind.h>

#include "crypto-ops.h"

using namespace emscripten;

float foo(float a, float b, float t)
{
    return (1 - t) * a + t * b;
}
EMSCRIPTEN_BINDINGS(my_module)
{ // C++ -> JS
    function("foo", &foo);
}
extern "C"
{ // C -> JS
}
int main() {
  printf("hello, world!\n");
  return 0;
}
