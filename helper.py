import argparse
from dataclasses import dataclass
import os
import subprocess


@dataclass
class Platform:
    name: str
    image: str
    arch: str


@dataclass
class BuildArgs:
    platforms: list[Platform]
    dir: str = ''
    name: str = ''
    version: str = '0.0.1'
    tool: str = 'podman'


def error_handler(str):
    print(f"ERROR: {str}")
    exit(-1)


def warning(str):
    print(f"WARN: {str}")


def run_subprocess(command_list: list[str]):
    result = subprocess.run(
        command_list,
        capture_output=True,
        text=True)
    print(result.stdout)
    print(result.stderr)
    return result


def remove_container(container, force=False):
    run_subprocess([BuildArgs.tool, 'rm', container,
                    '--force' if force else ''])


def parse_arguments(script: str):
    parser = argparse.ArgumentParser(
        description='Build siapps with Podman or Docker. For more information '
        'have a look at the README of https://github.com/siemens/siapp-sdk')
    parser.add_argument('app', metavar='APP', type=str,
                        help='The siapp to build. Must be in the same'
                             ' directory or directory path, which contains a'
                             ' Dockerfile.')
    parser.add_argument('-n', '--name',
                        help='Name of the siapp. Default: lower app name.')
    parser.add_argument('-v', '--version', default=BuildArgs.version,
                        help='Version of the siapp. Default: '
                        + BuildArgs.version)
    parser.add_argument('-t', '--tool', default=BuildArgs.tool,
                        help='Container Tool to use. Default: podman',
                        choices=['podman', 'docker'])
    if script == 'build':
        parser.add_argument('-p', '--platform', default="all",
                            help='Select Platform. Default: all',
                            choices=['all', 'a8000', 'sws'])
    elif script == 'run':
        parser.add_argument('-p', '--platform', required=True,
                            help='Select Platform.',
                            choices=['a8000', 'sws'])
    else:
        error_handler("Unknown script")

    args = parser.parse_args()

    # Get absolute path of the app, if it is not a directory, exit
    abs_path = os.path.abspath(args.app)
    if os.path.isdir(abs_path):
        BuildArgs.dir = args.app
        name = os.path.basename(os.path.normpath(abs_path))
        BuildArgs.name = name.lower().replace(' ', '')
    else:
        error_handler(f"Not a directory {os.path.abspath(args.app)}")
    if args.name:
        BuildArgs.name = args.name
    BuildArgs.version = args.version
    BuildArgs.tool = args.tool

    a8000 = Platform('a8000', 'linux/arm/v7', 'armv7')
    sws = Platform('sws', 'linux/amd64', 'x64')

    if args.platform == "all":
        BuildArgs.platforms = [a8000, sws]
    elif args.platform == "a8000":
        BuildArgs.platforms = [a8000]
    elif args.platform == "sws":
        BuildArgs.platforms = [sws]


def init_multiarch_qemu():
    try:
        run_subprocess([BuildArgs.tool, 'run', '--rm', '--privileged',
                        'multiarch/qemu-user-static', '--reset', '-p', 'yes'])
    except FileNotFoundError:
        if BuildArgs.tool == 'podman':
            print('INFO: Podman is not installed. To use Docker instead, add the parameter \"-t docker\".'
                  'Further information can be found in the README of https://github.com/siemens/siapp-sdk')
        elif BuildArgs.tool == 'docker':
            print('INFO: Docker is not installed. To use Podman instead, add the parameter \"-t podman\".'
                  'Further information can be found in the README of https://github.com/siemens/siapp-sdk')
        quit()
