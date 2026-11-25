# Source this file from the repository root: source scripts/env.sh
if [ ! -f ./toolchains.json ]; then
  echo 'Run source scripts/env.sh from the formal-methods-lab root.' >&2
  return 1
fi
export FORMAL_TOOLS="${FORMAL_TOOLS:-$PWD/.tools}"
export ELAN_HOME="$FORMAL_TOOLS/elan"
export JAVA_HOME="$FORMAL_TOOLS/java"
if [ -d "$JAVA_HOME/Contents/Home" ]; then
  export JAVA_HOME="$JAVA_HOME/Contents/Home"
fi
export PATH="$FORMAL_TOOLS/node/bin:$FORMAL_TOOLS/pnpm-native:$ELAN_HOME/bin:$JAVA_HOME/bin:$PATH"
