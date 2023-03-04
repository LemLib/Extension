/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import * as fs from 'fs';

import axios from 'axios';

import { execute } from '../../prosCli';

export async function getAllVersions(): Promise<string[]> {
    const URL = 'https://api.github.com/repos/lemlib/filesystem-manager/releases';

    const response = await axios.get(URL);

    const json: unknown = response.data;

    if (typeof json !== 'object' || json === null) throw new Error('Invalid response from GitHub API');

    const data = json as { tag_name: string }[];

    const versions = data.map((release) => release.tag_name.replace('v', ''));

    return versions;
}

export async function getLatestVersion(): Promise<string> {
    const URL = 'https://api.github.com/repos/lemlib/filesystem-manager/releases/latest';

    const response = await axios.get(URL);

    const json: unknown = response.data;

    if (typeof json !== 'object' || json === null) throw new Error('Invalid response from GitHub API');

    const { tag_name } = json as { tag_name: string };

    return tag_name.replace('v', '');
}

export async function downloadVersion(version: string, path: string, progress: vscode.Progress<{ message?: string | undefined; increment?: number | undefined; }>): Promise<{downloaded: number, total: number}> {
    progress.report({ message: 'Fetching release information for v' + version});
    
    const URL = `https://api.github.com/repos/lemlib/filesystem-manager/releases/tags/v${version}`;

    const toDownload: string[] = [
        '_pros_ld_timestamp.o',
        'cold.package.bin',
        'cold.package.elf',
        'hot.package.bin',
        'hot.package.elf',
        'main.cpp.o'
    ];

    progress.report({ message: 'Fetching release assets for v' + version});

    const response = await axios.get(URL);
    
    const json: unknown = response.data;

    if (typeof json !== 'object' || json === null) {
        progress.report({ message: 'Failed to fetch release assets for v' + version});
        
        throw new Error('Invalid response from GitHub API');
    }

    const { assets } = json as { assets: { browser_download_url: string }[] };

    let downloaded: number = 0;
    let total: number = 0;

    progress.report({ message: 'Downloading release assets for v' + version + ' [0/' + toDownload.length + ']'});

    for (const asset of assets) {
        if (toDownload.includes(asset.browser_download_url.split('/').pop() as string)) {
            progress.report({ message: 'Downloading release assets for v' + version + ' [' + (downloaded + 1) + '/' + toDownload.length + ']'});
            total += 1;
            if (await downloadFile(asset.browser_download_url, path)) downloaded += 1;
        }
    }

    progress.report({ message: 'Downloaded release assets for v' + version + ' [' + downloaded + '/' + toDownload.length + ']'});

    progress.report({ message: 'Writing version file'});

    const writer = fs.createWriteStream(path + '/' + version + '.ver');

    writer.write(' ');

    writer.end();

    progress.report({ message: 'Finished downloading v' + version + '!'});

    await createProjectPros(path.replace('/bin', ''), progress);

    vscode.window.showInformationMessage('Finished downloading v' + version + '!');

    return { downloaded, total };
}

export async function downloadFile(url: string, path: string): Promise<boolean> {
    const name: string = url.split('/').pop() as string;

    const response = await axios.get(url, {
        responseType: 'stream'
    });

    const writer = fs.createWriteStream(path + '/' + name);

    response.data.pipe(writer);

    return true;
}

export function findLatestVersion(versions: string[]): string {
    const sortedVersions = versions.sort((a, b) => {
        const aParts = a.split('.');
        const bParts = b.split('.');
        
        for (let i = 0; i < aParts.length; i++) {
            if (parseInt(aParts[i]) > parseInt(bParts[i])) return -1;
            if (parseInt(aParts[i]) < parseInt(bParts[i])) return 1;
        }
        
        return 0;
    });
    
    return sortedVersions[0];
}

export async function findKernelVersions(path: string): Promise<string[]> {
    const versions: string[] = fs.readdirSync(path).filter((file) => file.startsWith('kernel@'));
    
    return versions;
}

export async function createProjectPros(path: string, progress: vscode.Progress<{ message?: string | undefined; increment?: number | undefined; }>): Promise<void> {
    const homedir = require('os').homedir();
    
    const prosDirectory = homedir.replace('\\', '/') + '/AppData/Roaming/PROS';
    
    const kernelVersions: string[] = await findKernelVersions(prosDirectory + '/templates');
    
    const kernel: string = findLatestVersion(kernelVersions);

    progress.report({ message: 'Creating project.pros file with ' + kernel});

    const projectProsData = {
        "py/object": "pros.conductor.project.Project",
        "py/state": {
            "project_name": "lemlib-filesystem",
            "target": "v5",
            "templates": {
                "kernel": {
                    "location": prosDirectory + '/templates/' + kernel,
                    "metadata": {
                        "cold_addr": "58720256",
                        "cold_output": "bin/cold.package.bin",
                        "hot_addr": "125829120",
                        "hot_output": "bin/hot.package.bin",
                        "origin": "pros-mainline",
                        "output": "bin/monolith.bin"
                    },
                    "name": "kernel",
                    "py/object": "pros.conductor.templates.local_template.LocalTemplate",
                    "supported_kernels": null,
                    "system_files": [
                        "common.mk",
                        "include/display/lv_objx/lv_tileview.h",
                        "firmware/libm.a",
                        "include/display/lv_hal/lv_hal_indev.h",
                        "include/display/lv_objx/lv_bar.h",
                        "include/pros/ext_adi.h",
                        "include/display/lv_fonts/lv_font_builtin.h",
                        "include/display/lv_draw/lv_draw_rect.h",
                        "include/display/lv_misc/lv_anim.h",
                        "include/display/lv_misc/lv_font.h",
                        "include/display/lv_misc/lv_color.h",
                        "include/display/lv_themes/lv_theme_zen.h",
                        "include/display/lv_misc/lv_symbol_def.h",
                        "include/display/lv_objx/lv_cb.h",
                        "include/pros/misc.h",
                        "include/display/lv_misc/lv_task.h",
                        "include/display/lv_core/lv_obj.h",
                        "include/display/lv_themes/lv_themes.mk",
                        "include/pros/adi.hpp",
                        "include/display/lv_objx/lv_line.h",
                        "include/display/lv_objx/lv_gauge.h",
                        "include/display/lv_objx/lv_arc.h",
                        "include/display/lv_core/lv_lang.h",
                        "include/pros/colors.h",
                        "include/display/lv_objx/lv_ta.h",
                        "include/pros/gps.h",
                        "include/display/lv_objx/lv_lmeter.h",
                        "include/pros/optical.h",
                        "include/pros/screen.hpp",
                        "include/display/lv_hal/lv_hal.mk",
                        "include/pros/serial.h",
                        "include/pros/link.h",
                        "include/display/lv_hal/lv_hal.h",
                        "include/display/lv_objx/lv_btnm.h",
                        "include/display/lv_objx/lv_img.h",
                        "include/display/lv_objx/lv_label.h",
                        "include/display/lv_misc/lv_gc.h",
                        "include/display/lvgl.h",
                        "include/pros/adi.h",
                        "include/pros/optical.hpp",
                        "include/display/lv_objx/lv_sw.h",
                        "include/api.h",
                        "include/pros/llemu.hpp",
                        "include/display/lv_core/lv_style.h",
                        "include/pros/colors.hpp",
                        "firmware/v5.ld",
                        "include/display/lv_draw/lv_draw_vbasic.h",
                        "include/display/lv_misc/lv_fs.h",
                        "include/display/lv_objx/lv_page.h",
                        "include/display/lv_draw/lv_draw.mk",
                        "include/display/lv_objx/lv_calendar.h",
                        "include/display/lv_objx/lv_win.h",
                        "include/pros/rtos.h",
                        "include/display/lv_conf_checker.h",
                        "include/display/lv_themes/lv_theme_night.h",
                        "include/display/lv_objx/lv_cont.h",
                        "include/display/licence.txt",
                        "include/pros/api_legacy.h",
                        "include/display/lv_misc/lv_log.h",
                        "firmware/libc.a",
                        "include/pros/rtos.hpp",
                        "include/display/lv_objx/lv_roller.h",
                        "include/display/lv_draw/lv_draw_label.h",
                        "include/display/lv_objx/lv_spinbox.h",
                        "include/display/lv_misc/lv_mem.h",
                        "include/display/lv_objx/lv_led.h",
                        "include/display/lv_objx/lv_canvas.h",
                        "include/display/lv_misc/lv_circ.h",
                        "include/pros/screen.h",
                        "include/pros/apix.h",
                        "include/display/lv_objx/lv_objx.mk",
                        "include/display/lv_misc/lv_txt.h",
                        "include/display/lv_draw/lv_draw_line.h",
                        "include/display/lv_draw/lv_draw.h",
                        "include/display/lv_objx/lv_preload.h",
                        "include/display/lv_themes/lv_theme_material.h",
                        "include/pros/distance.hpp",
                        "include/pros/rotation.hpp",
                        "include/display/lv_themes/lv_theme.h",
                        "include/display/lv_misc/lv_area.h",
                        "firmware/libpros.a",
                        "include/pros/motors.hpp",
                        "include/display/lv_misc/lv_ufs.h",
                        "include/display/lv_misc/lv_math.h",
                        "include/display/lv_core/lv_group.h",
                        "include/display/lv_objx/lv_chart.h",
                        "include/display/lv_objx/lv_slider.h",
                        "include/display/lv_draw/lv_draw_triangle.h",
                        "include/display/lv_objx/lv_mbox.h",
                        "include/display/lv_hal/lv_hal_disp.h",
                        "include/pros/misc.hpp",
                        "include/display/lv_objx/lv_list.h",
                        "include/pros/serial.hpp",
                        "include/display/lv_objx/lv_imgbtn.h",
                        "include/pros/vision.h",
                        "include/display/lv_objx/lv_objx_templ.h",
                        "firmware/v5-hot.ld",
                        "include/display/lv_core/lv_indev.h",
                        "include/pros/llemu.h",
                        "include/pros/imu.h",
                        "include/display/README.md",
                        "include/pros/rotation.h",
                        "include/display/lv_version.h",
                        "include/pros/vision.hpp",
                        "include/display/lv_themes/lv_theme_nemo.h",
                        "include/display/lv_core/lv_vdb.h",
                        "include/display/lv_objx/lv_ddlist.h",
                        "include/display/lv_core/lv_core.mk",
                        "include/pros/imu.hpp",
                        "include/display/lv_misc/lv_ll.h",
                        "include/display/lv_draw/lv_draw_rbasic.h",
                        "include/display/lv_themes/lv_theme_mono.h",
                        "include/display/lv_fonts/lv_fonts.mk",
                        "include/display/lv_misc/lv_templ.h",
                        "include/display/lv_themes/lv_theme_templ.h",
                        "include/display/lv_themes/lv_theme_default.h",
                        "include/display/lv_objx/lv_btn.h",
                        "include/display/lv_conf.h",
                        "include/display/lv_core/lv_refr.h",
                        "include/pros/motors.h",
                        "include/display/lv_objx/lv_tabview.h",
                        "include/pros/gps.hpp",
                        "include/display/lv_hal/lv_hal_tick.h",
                        "include/pros/error.h",
                        "firmware/v5-common.ld",
                        "include/display/lv_draw/lv_draw_arc.h",
                        "include/display/lv_themes/lv_theme_alien.h",
                        "include/pros/distance.h",
                        "include/display/lv_objx/lv_table.h",
                        "include/display/lv_misc/lv_misc.mk",
                        "include/display/lv_draw/lv_draw_img.h",
                        "include/display/lv_objx/lv_kb.h",
                        "include/pros/link.hpp"
                    ],
                    "target": "v5",
                    "user_files": [
                        ".gitignore",
                        "include/main.h",
                        "Makefile",
                        "src/main.cc",
                        "include/main.hpp",
                        "src/main.c",
                        "src/main.cpp",
                        "include/main.hh"
                    ],
                    "version": "3.7.3"
                }
            },
            "upload_options": {}
        }
    };

    const writer = fs.createWriteStream(path + '/project.pros');

    writer.write(JSON.stringify(projectProsData, null, 4));

    writer.end();

    await new Promise((resolve) => writer.on('finish', resolve));
}

export async function isLatestDownloaded(): Promise<boolean> {
    const path: string = vscode.workspace.workspaceFolders?.[0].uri.fsPath as string + '/.lemlib/filesystem-manager/bin';
    
    if (!fs.existsSync(path)) return false;

    const installedVersions: string[] = fs.readdirSync(path).filter((file) => file.endsWith('.ver')).map((file) => file.replace('.ver', ''));
    
    const latest: string = await getLatestVersion();
    
    return installedVersions.includes(latest);
}

export async function download(): Promise<void> {
    const path: string = vscode.workspace.workspaceFolders?.[0].uri.fsPath as string + '/.lemlib/filesystem-manager/bin';
    
    if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });
    
    const installedVersions: string[] = fs.readdirSync(path).filter((file) => file.endsWith('.ver')).map((file) => file.replace('.ver', ''));
    
    const versions: string[] = await getAllVersions();
    const latest: string = await getLatestVersion();
    
    if (installedVersions.includes(latest)) {
        vscode.window.showInformationMessage('Latest version is already installed!');
        return;
    }
    
    const versionsQuickPick: vscode.QuickPickItem[] = versions.map((version) => {
        return {
            label: version === latest ? 'Latest' : version,
            description: version === latest ? 'Recommended' : undefined
        };
    });
    
    const version: string | undefined = await vscode.window.showQuickPick(versionsQuickPick, {
        placeHolder: 'Select a version to download'
    }).then((item) => item?.label);
    
    if (!version) return;

    const progress = vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Downloading filesystem manager v' + version === 'Latest' ? latest : version,
        cancellable: false
    }, async (progress) => {
        return await downloadVersion(version === 'Latest' ? latest : version, path, progress);
    });
    
    progress.then((result) => {
        if (result.downloaded !== result.total) {
            vscode.window.showErrorMessage('Failed to download all assets for v' + version === 'Latest' ? latest : version + '! [' + result.downloaded + '/' + result.total + ']');
        }
    });
}

export default async function upload(): Promise<void> {
    const isLatest: boolean = await isLatestDownloaded();

    if (!isLatest) await download();


}