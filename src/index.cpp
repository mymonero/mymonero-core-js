#include <stdio.h>
#include <emscripten/bind.h>

using namespace emscripten;

float foo(float a, float b, float t)
{
    return (1 - t) * a + t * b;
}
extern "C" {

	#include "crypto-ops.h"
}
EMSCRIPTEN_BINDINGS(my_module)
{ // C++ -> JS
    function("foo", &foo);
}
extern "C"
{ // C -> JS
}
int main() {
  // printf("hello, world!\n");
  return 0;
}
