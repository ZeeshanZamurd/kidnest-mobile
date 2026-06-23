#!/usr/bin/env bash
# Install CocoaPods for KidNest iOS (system Ruby 2.6 cannot install modern CocoaPods)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export LANG="${LANG:-en_US.UTF-8}"
export LC_ALL="${LC_ALL:-en_US.UTF-8}"

echo "==> KidNest CocoaPods setup"
echo ""

if command -v pod >/dev/null 2>&1; then
  echo "CocoaPods already installed: $(pod --version)"
else
  if [[ ! -d "$HOME/.rbenv" ]]; then
    echo "Installing rbenv (Ruby version manager)..."
    git clone --depth 1 https://github.com/rbenv/rbenv.git "$HOME/.rbenv"
    git clone --depth 1 https://github.com/rbenv/ruby-build.git "$HOME/.rbenv/plugins/ruby-build"
  fi

  export PATH="$HOME/.rbenv/bin:$HOME/.rbenv/shims:$PATH"
  eval "$(rbenv init -)"

  if ! rbenv versions --bare 2>/dev/null | grep -qx '3.2.6'; then
    echo "Installing Ruby 3.2.6 (takes ~5 minutes)..."
    OPENSSL_DIR="$(brew --prefix openssl@3 2>/dev/null || brew --prefix openssl 2>/dev/null || echo /usr/local/opt/openssl@3)"
    RUBY_CONFIGURE_OPTS="--with-openssl-dir=$OPENSSL_DIR" rbenv install 3.2.6
  fi

  rbenv global 3.2.6
  echo "Ruby: $(ruby --version)"

  echo "Installing CocoaPods gem..."
  gem install cocoapods -v 1.16.2
  pod --version
fi

if ! xcodebuild -version >/dev/null 2>&1; then
  echo ""
  echo "ERROR: Xcode not configured. Run:"
  echo "  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
  echo "  sudo xcodebuild -license accept"
  exit 1
fi

echo "Xcode: $(xcodebuild -version | head -1)"
echo "==> Running pod install..."
(cd ios && pod install)

echo ""
echo "Done. Add rbenv to your shell (~/.zshrc):"
echo '  export PATH="$HOME/.rbenv/bin:$PATH"'
echo '  eval "$(rbenv init - zsh)"'
echo '  export LANG=en_US.UTF-8'
echo ""
echo "Then run on iPhone:"
echo "  npm run ios:device"
