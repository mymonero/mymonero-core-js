#include <stdio.h>
#include <emscripten/bind.h>

using namespace emscripten;

float foo(float a, float b, float t)
{
    return (1 - t) * a + t * b;
}
EMSCRIPTEN_BINDINGS(my_module)
{
    function("foo", &foo);
}

int main() {
  printf("hello, world!\n");
  return 0;
}
