
cmake_minimum_required(VERSION 3.4.1)

SET(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11")

project(MyMoneroCoreCpp)
#
include_directories("build/boost/include") # must exist already - run bin/build-boost-emscripten.sh
#
include_directories("src")
#
set(MYMONERO_CORE_CPP "src/submodules/mymonero-core-cpp")
set(MYMONERO_CORE_CPP_SRC "${MYMONERO_CORE_CPP}/src")
include_directories("${MYMONERO_CORE_CPP}/src")
#
set(MONERO_SRC "${MYMONERO_CORE_CPP}/contrib/monero-core-custom")
include_directories(${MONERO_SRC})
include_directories("${MONERO_SRC}/epee/include")
include_directories("${MONERO_SRC}/common")
include_directories("${MONERO_SRC}/vtlogger")
include_directories("${MONERO_SRC}/crypto")
include_directories("${MONERO_SRC}/cryptonote_basic")
include_directories("${MONERO_SRC}/multisig")
include_directories("${MONERO_SRC}/cryptonote_core")
include_directories("${MONERO_SRC}/cryptonote_protocol")
include_directories("${MONERO_SRC}/wallet")
include_directories("${MONERO_SRC}/rpc")
include_directories("${MONERO_SRC}/mnemonics")
#
# keeping test files in a separate source directory 
# file(GLOB TEST_SRCS RELATIVE ${CMAKE_CURRENT_SOURCE_DIR} test/test_*.cpp)
#
set(
    SRC_FILES
    #
    src/index.cpp
    #
    ${MYMONERO_CORE_CPP_SRC}/monero_address_utils.hpp
    ${MYMONERO_CORE_CPP_SRC}/monero_address_utils.cpp
    ${MYMONERO_CORE_CPP_SRC}/monero_paymentID_utils.hpp
    ${MYMONERO_CORE_CPP_SRC}/monero_paymentID_utils.cpp
    ${MYMONERO_CORE_CPP_SRC}/monero_key_image_utils.hpp
    ${MYMONERO_CORE_CPP_SRC}/monero_key_image_utils.cpp
    ${MYMONERO_CORE_CPP_SRC}/monero_transfer_utils.hpp
    ${MYMONERO_CORE_CPP_SRC}/monero_transfer_utils.cpp
    ${MYMONERO_CORE_CPP_SRC}/monero_fork_rules.hpp
    ${MYMONERO_CORE_CPP_SRC}/monero_fork_rules.cpp
    ${MYMONERO_CORE_CPP_SRC}/monero_wallet_utils.hpp
    ${MYMONERO_CORE_CPP_SRC}/monero_wallet_utils.cpp
    ${MYMONERO_CORE_CPP_SRC}/serial_bridge_index.hpp
    ${MYMONERO_CORE_CPP_SRC}/serial_bridge_index.cpp
    ${MYMONERO_CORE_CPP_SRC}/tools__ret_vals.hpp
    ${MYMONERO_CORE_CPP_SRC}/tools__ret_vals.cpp
    #
    ${MONERO_SRC}/cryptonote_basic/cryptonote_basic_impl.cpp
    ${MONERO_SRC}/cryptonote_basic/account.cpp
    ${MONERO_SRC}/cryptonote_basic/cryptonote_format_utils.cpp
    ${MONERO_SRC}/crypto/crypto.cpp
    ${MONERO_SRC}/crypto/hash.c
    ${MONERO_SRC}/crypto/slow-hash.c
    ${MONERO_SRC}/crypto/oaes_lib.c
    ${MONERO_SRC}/crypto/crypto-ops.c
    ${MONERO_SRC}/crypto/crypto-ops-data.c
    ${MONERO_SRC}/crypto/keccak.c
    ${MONERO_SRC}/crypto/random.c
    ${MONERO_SRC}/crypto/aesb.c
    ${MONERO_SRC}/crypto/tree-hash.c
    ${MONERO_SRC}/crypto/hash-extra-blake.c
    ${MONERO_SRC}/crypto/blake256.c
    ${MONERO_SRC}/crypto/hash-extra-groestl.c
    ${MONERO_SRC}/crypto/hash-extra-jh.c
    ${MONERO_SRC}/crypto/hash-extra-skein.c
    ${MONERO_SRC}/crypto/groestl.c
    ${MONERO_SRC}/crypto/jh.c
    ${MONERO_SRC}/crypto/skein.c
    ${MONERO_SRC}/cryptonote_core/cryptonote_tx_utils.cpp
    ${MONERO_SRC}/common/base58.cpp
    ${MONERO_SRC}/common/threadpool.cpp
    ${MONERO_SRC}/epee/src/hex.cpp
    ${MONERO_SRC}/epee/src/string_tools.cpp
    ${MONERO_SRC}/epee/src/memwipe.c
    ${MONERO_SRC}/epee/src/wipeable_string.cpp
    ${MONERO_SRC}/device/device.cpp
    ${MONERO_SRC}/device/device_default.cpp
    ${MONERO_SRC}/ringct/rctOps.cpp
    ${MONERO_SRC}/ringct/rctTypes.cpp
    ${MONERO_SRC}/ringct/rctCryptoOps.c
    ${MONERO_SRC}/ringct/rctSigs.cpp
    ${MONERO_SRC}/ringct/bulletproofs.cc
    ${MONERO_SRC}/mnemonics/electrum-words.cpp
    ${MONERO_SRC}/vtlogger/logger.cpp
)

set(boost_DIR ${CMAKE_SOURCE_DIR}/build/boost)

# add_library(boost_atomic STATIC IMPORTED)
# set_target_properties(
#     boost_atomic PROPERTIES IMPORTED_LOCATION
#     ${boost_DIR}/lib/libboost_atomic.a
# )
# #
# add_library(boost_chrono STATIC IMPORTED)
# set_target_properties(
#     boost_chrono PROPERTIES IMPORTED_LOCATION
#     ${boost_DIR}/lib/libboost_chrono.a
# )
# #
# add_library(boost_date_time STATIC IMPORTED)
# set_target_properties(
#     boost_date_time PROPERTIES IMPORTED_LOCATION
#     ${boost_DIR}/lib/libboost_date_time.a
# )
# #
# add_library(boost_filesystem STATIC IMPORTED)
# set_target_properties(
#     boost_filesystem PROPERTIES IMPORTED_LOCATION
#     ${boost_DIR}/lib/libboost_filesystem.a
# )
# #
# add_library(boost_locale STATIC IMPORTED)
# set_target_properties(
#     boost_locale PROPERTIES IMPORTED_LOCATION
#     ${boost_DIR}/lib/libboost_locale.a
# )
# #
# add_library(boost_program_options STATIC IMPORTED)
# set_target_properties(
#     boost_program_options PROPERTIES IMPORTED_LOCATION
#     ${boost_DIR}/lib/libboost_program_options.a
# )
# #
# add_library(boost_regex STATIC IMPORTED)
# set_target_properties(
#     boost_regex PROPERTIES IMPORTED_LOCATION
#     ${boost_DIR}/lib/libboost_regex.a
# )
# #
# add_library(boost_serialization STATIC IMPORTED)
# set_target_properties(
#     boost_serialization PROPERTIES IMPORTED_LOCATION
#     ${boost_DIR}/lib/libboost_serialization.a
# )
# #
# add_library(boost_signals STATIC IMPORTED)
# set_target_properties(
#     boost_signals PROPERTIES IMPORTED_LOCATION
#     ${boost_DIR}/lib/libboost_signals.a
# )
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
# add_library(boost_timer STATIC IMPORTED)
# set_target_properties(
#     boost_timer PROPERTIES IMPORTED_LOCATION
#     ${boost_DIR}/lib/libboost_timer.a
# )
# #
# add_library(boost_wserialization STATIC IMPORTED)
# set_target_properties(
#     boost_wserialization PROPERTIES IMPORTED_LOCATION
#     ${boost_DIR}/lib/libboost_wserialization.a
# )
#
#
#
set(
	EMCC_LINKER_FLAGS 
    #unsure if the -I...boost..include is necessary here due to include above
	"-Wall -std=c++11 \
    --bind -s MODULARIZE=1 \
    -Oz \
    --llvm-lto 1 \
    -s WASM=1 \
    --post-js ${CMAKE_CURRENT_LIST_DIR}/src/module-post.js \
    -s \"BINARYEN_METHOD='native-wasm'\" \
    -s NO_DYNAMIC_EXECUTION=1 \
    -s \"BINARYEN_TRAP_MODE='clamp'\" \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s PRECISE_F32=1 \
    -s 'EXPORT_NAME=\"MyMoneroCoreCpp\"' \
    "
    # --closure 1 \
    # -s ASSERTIONS=1 \ 
    # -s EXTRA_EXPORTED_RUNTIME_METHODS='[\"ccall\", \"cwrap\"]' \
    # -s DISABLE_EXCEPTION_CATCHING=0 \
    #    -s EXPORTED_FUNCTIONS='[\"_sc_reduce\", \"_sc_reduce32\", \"_sc_check\", \"_sc_add\", \"_ge_fromfe_frombytes_vartime\", \"_ge_mul8\", \"_ge_p1p1_to_p3\", \"_ge_p3_tobytes\", \"_ge_scalarmult\", \"_ge_tobytes\", \"_sc_sub\", \"_sc_mulsub\", \"_ge_scalarmult_base\", \"_sc_0\", \"_ge_double_scalarmult_base_vartime\", \"_ge_double_scalarmult_precomp_vartime\", \"_ge_frombytes_vartime\", \"_ge_dsm_precomp\"]' \
    # -s SAFE_HEAP=1

)


# extract the filename without an extension (NAME_WE)
add_executable(
	MyMoneroCoreCpp 
	${SRC_FILES}
)
set_target_properties(MyMoneroCoreCpp PROPERTIES LINK_FLAGS "${EMCC_LINKER_FLAGS}")
#set_target_properties(MyMoneroCoreCpp PROPERTIES SUFFIX ".html")

target_link_libraries(
    MyMoneroCoreCpp
    #
    # boost_atomic
    # boost_chrono
    # boost_date_time
    # boost_filesystem
    # boost_locale
    # boost_program_options
    # boost_regex
    # boost_serialization
    # boost_signals
    boost_system
    boost_thread
    # boost_timer
    # boost_wserialization
    #
    ${log-lib}
)