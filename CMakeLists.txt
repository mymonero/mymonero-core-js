
cmake_minimum_required(VERSION 3.4.1)

SET(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11")

project(MyMoneroCoreCpp)
# enable_testing()

#Find openSSL
# find_package(OpenSSL COMPONENTS
# 	crypto REQUIRED
# 	ssl REQUIRED
# )

# #Prep ourselves for compiling boost
# find_package(Boost COMPONENTS 
#     unit_test_framework REQUIRED
#     atomic REQUIRED
#     chrono REQUIRED
#     context REQUIRED
#     date_time REQUIRED
#     exception REQUIRED
#     filesystem REQUIRED
#     graph REQUIRED
#     iostreams REQUIRED
#     math_c99 REQUIRED
#     math_c99f REQUIRED
#     math_c99l REQUIRED
#     math_tr1 REQUIRED
#     math_tr1f REQUIRED
#     math_tr1l REQUIRED
#     prg_exec_monitor REQUIRED
#     program_options REQUIRED
#     random REQUIRED
#     regex REQUIRED
#     serialization REQUIRED
#     signals REQUIRED
#     system REQUIRED
#     test_exec_monitor REQUIRED
#     thread REQUIRED
#     timer REQUIRED
#     wave REQUIRED
#     wserialization REQUIRED
# )

# include_directories(${Boost_INCLUDE_DIRS})
include_directories("src")
include_directories("src/mymonero-core-cpp/src")
# include_directories("test")

# keeping test files in a separate source directory 
# file(GLOB TEST_SRCS RELATIVE ${CMAKE_CURRENT_SOURCE_DIR} test/test_*.cpp)

set(
    SRC_FILES
    #
    src/index.cpp
    #
    # TODO: hopefully pick up source from src/mymonero-core-cpp/src
) 
set(
	EMCC_LINKER_FLAGS 
	"--bind -Wall -s MODULARIZE=1 -s 'EXPORT_NAME=\"MyMoneroCoreCpp\"' -s EXPORTED_FUNCTIONS='[\"_sc_reduce32\"]' -s EXTRA_EXPORTED_RUNTIME_METHODS='[\"ccall\", \"cwrap\"]'"#"-s SAFE_HEAP=1 --bind -s WASM=1 -O3 -o ./cryptonote_crypto.emcpp.js -s LEGACY_GL_EMULATION=0  -s GL_UNSAFE_OPTS=0 --pre-js pre-module.js --post-js post-module.js -s ASSERTIONS=1 -s GL_ASSERTIONS=1 -s INVOKE_RUN=0  -std=c++11 -s USE_WEBGL2=1 -s FULL_ES3=1 -s USE_GLFW=3 -s OFFSCREENCANVAS_SUPPORT=1 --preload-file shaders --preload-file extern --use-preload-plugins"
)

# extract the filename without an extension (NAME_WE)
add_executable(
	MyMoneroCoreCpp 
	${SRC_FILES}
)
set_target_properties(MyMoneroCoreCpp PROPERTIES LINK_FLAGS "${EMCC_LINKER_FLAGS}")
# set_target_properties(MyMoneroCoreCpp PROPERTIES SUFFIX ".bc")
# target_link_libraries(
#     MyMoneroCoreCpp
#     #
#     OpenSSL::SSL
#     ${Boost_LIBRARIES} 
# )
