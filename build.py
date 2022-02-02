#!/usr/bin/python3

'''
siapp-sdk

SPDX-License-Identifier: MIT
Copyright 2022 Siemens AG

Author:
Armin Tirala <armin.tirala@siemens.com>

'''

import sys
import os
import shutil
import tarfile
import json
import subprocess
import pathlib
import uuid
import datetime


def _helper():
    print('SYNOPSIS: build.py PROJECTPATH [--name NAME] [--version VERSION]')


def _errorhandler(str):
    print(f"ERROR: {str}")
    exit(-1)


def _max_rootfs_size_in_mb():
    return 350


def _default_version():
    return '0.0.1'


def _arch_postfix():
    return 'arm32v7'


def _tool():
    return 'docker'


def _containerfile():
    return 'Dockerfile'


def _remove_container(container):
    subprocess.call([_tool(), 'rm', container], stderr=subprocess.PIPE, stdout=subprocess.PIPE)


def _copy_if_exists(src, dst):
    if os.path.exists(src):
        shutil.copytree(src, dst)


def _initialize_directory(dir):
    if os.path.exists(dir):
        shutil.rmtree(dir, ignore_errors=True)

        # required, because the rmtree subprocess may be too slow
        while os.path.exists(dir):
            pass

    os.makedirs(os.path.join(dir, 'tmp', 'meta-inf.pmf'))
    os.makedirs(os.path.join(dir, 'tmp', 'siapp'))
    os.makedirs(os.path.join(dir, 'tmp', 'out'))


def _byte_to_mb(size):
    return int((size / 1024 / 1024) + 1)


def _recomented_siapp_slot_size_in_mb(size):
    return int(((size / 7 / 1024 / 1024) * 10) + 31)


def _create_rootfs_container(src_dir, build_dir, container_name, version):
    '''
    Creates  the rootfs container based on the container file.
    '''

    container_file = os.path.join(src_dir, f"{_containerfile()}.{_arch_postfix()}")
    container_image = f"{container_name}-{version}"
    tar_file = os.path.join(build_dir, 'tmp', 'siapp', 'rootfs.tar')

    if not os.path.exists(container_file):
        _errorhandler(f"File does not exist: {container_file}")

    command_list = [_tool(), 'build', '-f', container_file, '-t', container_image, src_dir]
    if subprocess.call(command_list) != 0:
        _errorhandler("Could not build docker image!")

    command_list = [_tool(), 'create', '--name', container_name, '--platform', 'linux/arm/v7', container_image]
    if subprocess.call(command_list) != 0:
        _remove_container(container_name)

    command_list = [_tool(), 'export', '--output=' + tar_file, container_name]
    if subprocess.call(command_list) != 0:
        _remove_container(container_name)
        _errorhandler("Could not export root filesystem out of docker container!")

    file_size = os.path.getsize(tar_file)

    return file_size


def _create_oci_file(project_path, build_dir, container_name):
    '''
    Creates the config.json file. If the file does not exist in the project directory,
    use the template file.
    '''

    parent_dir = pathlib.Path(project_path).parent.absolute()
    config_file = os.path.join(project_path, 'config.json')

    root_config_file = os.path.join(parent_dir, 'templates', 'config.json')
    temp_config_file = os.path.join(build_dir, 'tmp', 'siapp', 'config.json')

    if not os.path.exists(config_file):
        if not os.path.exists(root_config_file):
            _errorhandler(f'Could not find OCI template file {root_config_file}')
        else:
            print(f'Info: OCI file {config_file} not found. OCI file is generated by template file!')
            shutil.copyfile(root_config_file, config_file)

    container_json = json.loads(subprocess.check_output([_tool(), 'inspect', container_name]))[0]

    with open(config_file, 'r') as f:
        config_json = json.load(f)

    config_json['process']['args'] = []
    config_json['root']['path'] = 'rootfs'

    if container_json.get('Config', False):
        config_obj = container_json['Config']

        if config_obj.get('Entrypoint', False):
            config_json['process']['args'].extend(config_obj['Entrypoint'])
        if config_obj.get('Cmd', False):
            config_json['process']['args'].append(config_obj['Cmd'])
        if config_obj.get('Env', False):
            config_json['process']['env'] = config_obj['Env']
        if config_obj.get('WorkingDir', False):
            config_json['process']['cwd'] = config_obj['WorkingDir']

    if not config_json['process']['args']:
        config_json['process']['args'].append('/bin/sh')

    with open(temp_config_file, 'w') as f:
        json.dump(config_json, f, indent=4)


def _create_meta_info_file(build_dir, name, container_name, version, size):
    date = datetime.datetime.now()
    container_json = json.loads(subprocess.check_output([_tool(), 'inspect', container_name]))[0]
    pim_pid_file = os.path.join(build_dir, 'tmp', 'meta-inf.pmf', 'pim.pid')

    pim_pid = f'ies_pkgname={name}\n'
    pim_pid += f'ies_pkgid={uuid.uuid4()}\n'
    pim_pid += f'ies_pkgrev={version}\n'
    pim_pid += f'ies_pkgtype=SIAPP\n'
    pim_pid += f'ies_pkgarch=armv7\n'
    pim_pid += f'ies_pkgrootfs_size_mb={_byte_to_mb(size)}\n'
    pim_pid += f'ies_pkgcontainerid={container_json["Id"]}\n'
    pim_pid += f'ies_pkgimageid={container_json["Image"]}\n'
    pim_pid += 'ies_pkgbuildtime=\"' + date.strftime("%d.%m.%Y  %H:%M") + '\"\n'

    with open(pim_pid_file, 'w') as f:
        f.write(pim_pid)


def _package_siapp(dir, container_name):
    out_dir = os.path.join(dir, 'tmp', 'out')
    scr_dir = os.path.join(dir, 'tmp')

    with tarfile.open(os.path.join(out_dir, 'meta-inf.pmf'), "w:", format=tarfile.GNU_FORMAT) as tar:
        tar.add(os.path.join(scr_dir, 'meta-inf.pmf'), arcname='')

    with tarfile.open(os.path.join(out_dir, 'siapp.tar.gz'), "w:gz", format=tarfile.GNU_FORMAT) as tar:
        tar.add(os.path.join(scr_dir, 'siapp'), arcname='')

    if os.path.exists(os.path.join(scr_dir, 'cmd')):
        with tarfile.open(os.path.join(out_dir, 'cmd.tar.gz'), "w:gz", format=tarfile.GNU_FORMAT) as tar:
            tar.add(os.path.join(scr_dir, 'cmd'), arcname='')
        os.rename(os.path.join(out_dir, 'cmd.tar.gz'), os.path.join(out_dir, 'cmd.tgz'))

    if os.path.exists(os.path.join(scr_dir, 'app-doc')):
        with tarfile.open(os.path.join(out_dir, 'app-doc.tar.gz'), "w:gz", format=tarfile.GNU_FORMAT) as tar:
            tar.add(os.path.join(scr_dir, 'app-doc'), arcname='')
        os.rename(os.path.join(out_dir, 'app-doc.tar.gz'), os.path.join(out_dir, 'app-doc.tgz'))

    with tarfile.open(os.path.join(dir, container_name + '.siapp'), "w:", format=tarfile.GNU_FORMAT) as tar:
        tar.add(out_dir, arcname='')

    file_size = os.path.getsize(os.path.join(dir, container_name + '.siapp'))

    return file_size


def _print_result(siapp_size, rootfs_size, siapp):
    name = os.path.basename(__file__)

    print(f"{name} - ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
    print(f"{name} - Size of unzipped root file system:                          {_byte_to_mb(rootfs_size)}MB")

    if _byte_to_mb(rootfs_size) > _max_rootfs_size_in_mb():
        print(f"{name} - Warning max. supported root file system size of {_max_rootfs_size_in_mb()}MB is reached")

    print(f"{name} - Recommended configured siapp slot size:                    {_recomented_siapp_slot_size_in_mb(siapp_size)}MB")
    print(f"{name} - Size of generated siapp installation file:                 {_byte_to_mb(siapp_size)}MB")
    print(f"{name} - ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
    print(f"{name} - Successfully generated {siapp}")


def main(dir, name, version):
    container_name = name + '-' + _arch_postfix()
    root_path = os.path.join(pathlib.Path(__file__).parent.resolve())
    project_path = os.path.normpath(os.path.join(root_path, dir))
    build_path = os.path.join(root_path, 'build', name + '-' + version)

    _initialize_directory(build_path)
    _remove_container(container_name)

    _copy_if_exists(os.path.join(project_path, 'cmd'), os.path.join(build_path, 'tmp', 'cmd'))
    _copy_if_exists(os.path.join(project_path, 'app-doc'), os.path.join(build_path, 'tmp', 'app-doc'))

    rootfs_size = _create_rootfs_container(project_path, build_path, container_name, version)
    if rootfs_size <= 0:
        _errorhandler("Could not read rootfs file size!")

    _create_oci_file(project_path, build_path, container_name)
    _create_meta_info_file(build_path, name, container_name, version, rootfs_size)

    siapp_size = _package_siapp(build_path, container_name)
    if siapp_size <= 0:
        _errorhandler("Could not read siapp file size!")

    shutil.rmtree(os.path.join(build_path, 'tmp'))

    _print_result(siapp_size, rootfs_size, str(os.path.join(build_path, container_name)))


if __name__ == "__main__":

    arglen = len(sys.argv)

    if arglen > 1:
        dir = sys.argv[1]
        name = sys.argv[1].lower().replace(' ', '')
        version = _default_version()

        for i, additional_argument in enumerate(sys.argv):
            if ("--name" in additional_argument or "-name" in additional_argument)and arglen > i:
                name = sys.argv[i + 1].lower().replace(' ', '')
            if ("--version" in additional_argument or "-version" in additional_argument) and arglen > i:
                version = sys.argv[i + 1].lower().replace(' ', '')

        main(dir, name, version)
    else:
        _helper()
        _errorhandler("project directory path not specified!")
