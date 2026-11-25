#!/usr/bin/env python3
"""Install pinned tools without modifying shell profiles or system packages."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import subprocess
import tempfile
import urllib.request

ROOT = Path(__file__).resolve().parent.parent


def run(args, **kwargs):
    print('+', ' '.join(map(str, args)), flush=True)
    subprocess.run(list(map(str, args)), check=True, **kwargs)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--tools-only', action='store_true')
    parser.add_argument('--tools-dir', type=Path, default=Path(os.environ.get('FORMAL_TOOLS', ROOT / '.tools')))
    args = parser.parse_args()
    tools = args.tools_dir.resolve()
    tools.mkdir(parents=True, exist_ok=True)
    lock = json.loads((ROOT / 'toolchains.json').read_text())
    arch = {'arm64': 'arm64', 'aarch64': 'arm64', 'x86_64': 'x64'}.get(platform.machine())
    system = {'Darwin': 'darwin', 'Linux': 'linux'}.get(platform.system())
    key = f'{system}-{arch}'
    if key not in lock['platforms']:
        raise SystemExit('Supported: macOS/Linux x64/arm64; Windows: use WSL2 or Dev Container.')

    def download(asset):
        cache = tools / 'downloads'
        cache.mkdir(exist_ok=True)
        dest = cache / asset['sha256']
        if not dest.exists():
            print('Downloading', asset['url'], flush=True)
            # A unique incomplete download is retained if interrupted; never clobber files.
            with tempfile.NamedTemporaryFile(dir=cache, delete=False) as out:
                with urllib.request.urlopen(asset['url'], timeout=90) as source:
                    while data := source.read(1024 * 1024):
                        out.write(data)
                downloaded = Path(out.name)
            if hashlib.sha256(downloaded.read_bytes()).hexdigest() != asset['sha256']:
                raise RuntimeError(f'Checksum mismatch: {downloaded}')
            os.link(downloaded, dest)
        if hashlib.sha256(dest.read_bytes()).hexdigest() != asset['sha256']:
            raise RuntimeError(f'Checksum mismatch: {dest}')
        return dest

    def unpack(name, asset, strip=1):
        archive = download(asset)
        dest = tools / name
        marker = dest / '.formal-install.json'
        if marker.exists():
            if json.loads(marker.read_text()) != asset:
                raise RuntimeError(f'Tool pin changed: use a new FORMAL_TOOLS directory ({dest}).')
            return dest
        if dest.exists():
            raise RuntimeError(f'Incomplete installation retained at {dest}; use a new FORMAL_TOOLS directory.')
        dest.mkdir()
        run(['tar', '-xzf', archive, '--strip-components', str(strip), '-C', dest])
        with marker.open('x') as file:
            json.dump(asset, file)
        return dest

    assets = lock['platforms'][key]
    unpack('node', assets['node'])
    java = unpack('java', assets['java'])
    if (java / 'Contents/Home').exists():
        java = java / 'Contents/Home'
    unpack('pnpm-native', assets['pnpm'])
    elan_installer = unpack('elan-installer', assets['elan'], strip=0)
    env = os.environ.copy()
    env['ELAN_HOME'] = str(tools / 'elan')
    env['JAVA_HOME'] = str(java)
    env['FORMAL_TOOLS'] = str(tools)
    env['PATH'] = os.pathsep.join(map(str, [tools / 'node/bin', tools / 'pnpm-native', tools / 'elan/bin', java / 'bin'])) + os.pathsep + env['PATH']
    if not (tools / 'elan/bin/elan').exists():
        run([elan_installer / 'elan-init', '-y', '--no-modify-path', '--default-toolchain', 'none'], env=env)
    run(['elan', 'toolchain', 'install', lock['lean']], env=env)
    tla = tools / 'tla'
    tla.mkdir(exist_ok=True)
    jar = download(lock['tla'])
    dest = tla / 'tla2tools.jar'
    if not dest.exists():
        os.link(jar, dest)
    if hashlib.sha256(dest.read_bytes()).hexdigest() != lock['tla']['sha256']:
        raise RuntimeError(f'Checksum mismatch: {dest}')
    if not args.tools_only:
        run(['pnpm', 'install', '--frozen-lockfile'], cwd=ROOT / 'typescript', env=env)
    print('Ready. From the repository root: source scripts/env.sh')


if __name__ == '__main__':
    main()
