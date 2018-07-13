
cmake_minimum_required(VERSION 3.4.1)

SET(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11")

project(MyMoneroCoreCpp)


include_directories("build/boost/include") # must exist already - run bin/build-boost-emscripten.sh
include_directories("src")
include_directories("src/submodules/monero-core-custom/crypto")
include_directories("src/submodules/monero-core-custom/epee/include")

# keeping test files in a separate source directory 
# file(GLOB TEST_SRCS RELATIVE ${CMAKE_CURRENT_SOURCE_DIR} test/test_*.cpp)

set(
    SRC_FILES
    #
    src/index.cpp
    src/submodules/monero-core-custom/crypto/crypto-ops.c
    #
    # TODO: hopefully pick up source from src/mymonero-core-cpp/src
)

set(boost_DIR ${CMAKE_SOURCE_DIR}/build/boost)

add_library(boost_atomic STATIC IMPORTED)
set_target_properties(
    boost_atomic PROPERTIES IMPORTED_LOCATION
    ${boost_DIR}/lib/libboost_atomic.a
)
#
add_library(boost_chrono STATIC IMPORTED)
set_target_properties(
    boost_chrono PROPERTIES IMPORTED_LOCATION
    ${boost_DIR}/lib/libboost_chrono.a
)
#
add_library(boost_context STATIC IMPORTED)
set_target_properties(
    boost_context PROPERTIES IMPORTED_LOCATION
    ${boost_DIR}/lib/libboost_context.a
)
#
add_library(boost_exception STATIC IMPORTED)
set_target_properties(
    boost_exception PROPERTIES IMPORTED_LOCATION
    ${boost_DIR}/lib/libboost_exception.a
)
#
add_library(boost_date_time STATIC IMPORTED)
set_target_properties(
    boost_date_time PROPERTIES IMPORTED_LOCATION
    ${boost_DIR}/lib/libboost_date_time.a
)
#
add_library(boost_filesystem STATIC IMPORTED)
set_target_properties(
    boost_filesystem PROPERTIES IMPORTED_LOCATION
    ${boost_DIR}/lib/libboost_filesystem.a
)
#
add_library(boost_math_c99 STATIC IMPORTED)
set_target_properties(
    boost_math_c99 PROPERTIES IMPORTED_LOCATION
    ${boost_DIR}/lib/libboost_math_c99.a
)
#
add_library(boost_math_c99f STATIC IMPORTED)
set_target_properties(
    boost_math_c99f PROPERTIES IMPORTED_LOCATION
    ${boost_DIR}/lib/libboost_math_c99f.a
)
#
add_library(boost_math_c99l STATIC IMPORTED)
set_target_properties(
    boost_math_c99l PROPERTIES IMPORTED_LOCATION
    ${boost_DIR}/lib/libboost_math_c99l.a
)
#
add_library(boost_math_tr1 STATIC IMPORTED)
set_target_properties(
    boost_math_tr1 PROPERTIES IMPORTED_LOCATION
    ${boost_DIR}/lib/libboost_math_tr1.a
)
#
add_library(boost_math_tr1l STATIC IMPORTED)
set_target_properties(
    boost_math_tr1l PROPERTIES IMPORTED_LOCATION
    ${boost_DIR}/lib/libboost_math_tr1l.a
)
#
add_library(boost_math_tr1f STATIC IMPORTED)
set_target_properties(
    boost_math_tr1f PROPERTIES IMPORTED_LOCATION
    ${boost_DIR}/lib/libboost_math_tr1l.a
)
#
add_library(boost_random STATIC IMPORTED)
set_target_properties(
    boost_random PROPERTIES IMPORTED_LOCATION
    ${boost_DIR}/lib/libboost_random.a
)
#
add_library(boost_locale STATIC IMPORTED)
set_target_properties(
    boost_locale PROPERTIES IMPORTED_LOCATION
    ${boost_DIR}/lib/libboost_locale.a
)
#
add_library(boost_iostreams STATIC IMPORTED)
set_target_properties(
    boost_iostreams PROPERTIES IMPORTED_LOCATION
    ${boost_DIR}/lib/libboost_iostreams.a
)
#
add_library(boost_signals STATIC IMPORTED)
set_target_properties(
    boost_signals PROPERTIES IMPORTED_LOCATION
    ${boost_DIR}/lib/libboost_signals.a
)
#
add_library(boost_timer STATIC IMPORTED)
set_target_properties(
    boost_timer PROPERTIES IMPORTED_LOCATION
    ${boost_DIR}/lib/libboost_timer.a
)
#
add_library(boost_container STATIC IMPORTED)
set_target_properties(
    boost_container PROPERTIES IMPORTED_LOCATION
    ${boost_DIR}/lib/libboost_container.a
)
#
add_library(boost_regex STATIC IMPORTED)
set_target_properties(
    boost_regex PROPERTIES IMPORTED_LOCATION
    ${boost_DIR}/lib/libboost_regex.a
)
#
add_library(boost_serialization STATIC IMPORTED)
set_target_properties(
    boost_serialization PROPERTIES IMPORTED_LOCATION
    ${boost_DIR}/lib/libboost_serialization.a
)
#
add_library(boost_system STATIC IMPORTED)
set_target_properties(
    boost_system PROPERTIES IMPORTED_LOCATION
    ${boost_DIR}/lib/libboost_system.a
)
#
add_library(boost_thread STATIC IMPORTED)
set_target_properties(
    boost_thread PROPERTIES IMPORTED_LOCATION
    ${boost_DIR}/lib/libboost_thread.a
)
#
add_library(boost_wserialization STATIC IMPORTED)
set_target_properties(
    boost_wserialization PROPERTIES IMPORTED_LOCATION
    ${boost_DIR}/lib/libboost_wserialization.a
)



set(
	EMCC_LINKER_FLAGS 
    #unsure if the -I...boost..include is necessary here due to include above
	"-Wall -std=c++11 -s MODULARIZE=1 -s WASM=1 -s ASSERTIONS=1 \
    --bind \
    -s 'EXPORT_NAME=\"MyMoneroCoreCpp\"' \
    -s EXPORTED_FUNCTIONS='[\"_sc_reduce32\"]' \
    -s EXTRA_EXPORTED_RUNTIME_METHODS='[\"ccall\", \"cwrap\"]'"#"-s SAFE_HEAP=1 --bind -O3 -s LEGACY_GL_EMULATION=0  -s GL_UNSAFE_OPTS=0 --pre-js pre-module.js --post-js post-module.js -s GL_ASSERTIONS=1 -s INVOKE_RUN=0  -s USE_WEBGL2=1 -s FULL_ES3=1 -s USE_GLFW=3 -s OFFSCREENCANVAS_SUPPORT=1 --preload-file shaders --preload-file extern --use-preload-plugins"
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

target_link_libraries(
    MyMoneroCoreCpp
    #
    boost_atomic
    boost_chrono
    boost_context
    boost_date_time
    boost_exception
    boost_filesystem
    boost_container
    # boost_graph
    boost_iostreams
    boost_locale
    boost_math_c99
    boost_math_c99f
    boost_math_c99l
    boost_math_tr1
    boost_math_tr1f
    boost_math_tr1l
    # boost_prg_exec_monitor
    # boost_program_options
    boost_random
    boost_regex
    boost_serialization
    boost_signals
    boost_system
    # boost_test_exec_monitor
    boost_thread
    boost_timer
    # boost_unit_test_framework
    # boost_wave
    boost_wserialization
    ${log-lib}
)