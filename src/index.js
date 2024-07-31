#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

const cookieString = () => `access_token=${config.COOKIE}`;

async function getLectureData (courseId, lectureId) {
    const url = `https://www.udemy.com/api-2.0/users/me/subscribed-courses/${courseId}/lectures/${lectureId}/?fields[lecture]=asset,description,download_url,is_free,last_watched_second&fields[asset]=asset_type,length,media_license_token,course_is_drmed,media_sources,captions,thumbnail_sprite,slides,slide_urls,download_urls,external_url&q=0.2678565073601946`;

    const headers = {
        'Cookie': cookieString()
    };

    try {
        const response = await axios.get(url, { headers });
        return response.data;
    } catch (error) {
        throw error
    }
};

async function getAllCourse(courseId) {
    try {
        const headers = {
            'Cookie': cookieString()
        };
        let url = `https://www.udemy.com/api-2.0/course-landing-components/${courseId}/me/?components=curriculum_context`
        const response = await axios.get(url, { headers });

        return response.data;
    } catch (error) {
        throw error
    }
}

async function ensureFileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function downloadSubtitle(subtitleUrl, subtitlePath) {
    if (await ensureFileExists(subtitlePath)) return
    const writer = fs.createWriteStream(subtitlePath);

    try {
        const response = await axios.get(subtitleUrl, {
            responseType: 'stream',
        });

        response.data.pipe(writer);

        return await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (err) {
        throw err;
    }
}

async function downloadCourse(data, filePath, quality = '480P') {
    if (await ensureFileExists(filePath)) return
    if (!data) {
        console.log('Error: Unable to download course data');
        return;
    }
    let listRawUrl = []

    if (data.asset.asset_type.toLowerCase() !== 'video') {
        console.log(`Course ${data.id} is not a video`);
        return
    }

    data.asset.media_sources.forEach(source => {
        if (source.type.toLowerCase() === 'video/mp4') listRawUrl.push(source)
    })

    data.asset.download_urls?.Video?.forEach(url => {
        listRawUrl.push({ label: url.label, src: url.file })
    })

    if (listRawUrl.length === 0) {
        console.log(`No video found for course ${data.id}`);
        return
    }

    const qualitys = []
    listRawUrl.forEach(item => {
        if (!qualitys.includes(item.label)) qualitys.push(item.label)
    })

    let url = listRawUrl.filter((source) => source.label === quality)[0]

    if (!url || url && url.length === 0) {
        url = listRawUrl[0]
        console.log(`No quality ${quality}P found in course. Downloading ${url.label}P...`);
        return
    }
    url = url.src

    const writer = fs.createWriteStream(filePath);

    try {
        const response = await axios.get(url, {
            responseType: 'stream',
        });

        response.data.pipe(writer);

        return await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (err) {
        throw err
    }
}

function sanitizeTitle(title) {
    return title
        .replace(/[\/\\:*?"<>|]/g, '_') // Ganti karakter yang tidak valid dengan underscore
        .trim(); // Hapus spasi di awal dan akhir
}

async function processCourses(index, courseId, groupList, coursePath) {
    let [group, curri] = index.split('-')
    group = parseInt(group) - 1
    curri = parseInt(curri) || 0

    // Mendapatkan grup dari listCourse berdasarkan indeks grup
    const groupKeys = Object.keys(groupList);
    if (group < 0 || group >= groupKeys.length) {
        console.log(`Index grup ${group} tidak tersedia.`);
        return;
    }

    let groupKey = groupKeys[group]
    const sections = groupList[groupKey];

    // Membuat folder untuk grup
    const groupPath = path.join(process.cwd(), coursePath, groupKey.replace(/ /g, '_'));
    if (!fs.existsSync(groupPath)) {
        fs.mkdirSync(groupPath, { recursive: true });
        console.log(`Folder ${groupKey} berhasil dibuat.`);
    }
    
    const gdata = await getLectureData(courseId, curri !== 0 ? sections[curri - 1].id : sections[0].id);
    let listRawUrl = []

    if (gdata.asset.asset_type.toLowerCase() !== 'video') {
        console.log(`Course ${gdata.id} is not a video`);
        return
    }

    gdata.asset.media_sources.forEach(source => {
        if (source.type.toLowerCase() === 'video/mp4') listRawUrl.push(source)
    })

    gdata.asset.download_urls?.Video?.forEach(url => {
        listRawUrl.push({ label: url.label, src: url.file })
    })

    const qualitys = []
    listRawUrl.forEach(item => {
        if (!qualitys.includes(item.label)) qualitys.push(item.label)
    })
    
    let quality = await question(`\n- ${qualitys.join('P\n- ')}P\nEnter the quality you want to download (ex: 480P): `) || '480P';
    quality = quality.toUpperCase().replace('P', '')

    const subtitles = gdata.asset.captions
    let capSub = subtitles.map((sub, idx) => `${idx + 1}. ${sub.video_label}`).join('\n')
    let subtitle = await question('\n' + capSub + '\n0. None/No Subtitle\nEnter the subtitle you want to download (ex: 1): ')
    subtitle = !subtitle || subtitle === 0 ? null : subtitles[parseInt(subtitle) - 1]

    if (curri === 0) {
        console.log('Starting Batch Download...')
        // Proses semua section dalam grup
        for (let i = 0; i < sections.length; i++) {
            const data = await getLectureData(courseId, sections[i].id);
            if (data.asset.asset_type.toLowerCase() !== 'video') {
                console.log(`Course ${gdata.id} is not a video`);
                continue
            }
            
            let newsub = data.asset.captions.find(sub => sub.locale_id === subtitle.locale_id)
            const filePath = path.join(groupPath, `${i + 1}_${sanitizeTitle(sections[i].title)}.mp4`);
            const vttPath = path.join(groupPath, `${newsub.title}`);
            if (fs.existsSync(filePath)) continue

            await downloadSubtitle(newsub.url, vttPath);
            await downloadCourse(data, filePath, quality);
            console.log(`\n${sections[i].title} Successfully Downloaded.`);
        }
    } else if (Number.isInteger(curri)) {
        if (gdata.asset.asset_type.toLowerCase() !== 'video') {
            console.log(`Course ${gdata.id} is not a video`);
            return
        }
        console.log(subtitle)
        curri = curri - 1
        // Proses section berdasarkan index
        if (curri >= 0 && curri < sections.length) {
            const sec = sections[curri];
            const filePath = path.join(groupPath, `${curri + 1}_${sanitizeTitle(sec.title)}.mp4`);
            const vttPath = path.join(groupPath, `${subtitle.title}`);
            if (fs.existsSync(filePath)) return

            console.log('\nDownloading Video & Subtitles...');
            await downloadSubtitle(subtitle.url, vttPath);
            await downloadCourse(gdata, filePath, quality);
            console.log(`\n${sec.title} Successfully Downloaded.`);
        } else {
            console.log(`Index section ${curri} not found in ${groupKey}`);
        }
    } else {
        console.log(`Format index tidak valid.`);
    }
}

async function getUserCourse() {
    try {
        const response = await axios.get('https://www.udemy.com/api-2.0/users/me/subscribed-courses/?is_archived=false', {
            headers: {
                'Cookie': cookieString()
            }
        });

        const listCourse = response.data.results.map((course) => {
            return {
                title: course.title,
                clean_title: course.published_title,
                id: course.id,
                cover: course.image_480x270,
            }
        })
        return listCourse
    } catch (error) {
        throw error
    }
}


async function main() {
    try {
        if (!config.COOKIE) {
            let newCookie = await question('Enter your cookie (access_token): ');
            newCookie.replace('"', '')
            config.COOKIE = newCookie;
            fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify(config, null, 4));
            console.log('Cookie saved!');
        }

        let ask = await question('1. Download Courses\n2. Replace Cookie\n3. exit\n\nSelect option: ');
        if (ask === '2') {
            let newCookie = await question('Enter your cookie (access_token): ');
            newCookie.replace('"', '')
            config.COOKIE = newCookie;
            fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify(config, null, 4));
            console.log('Cookie saved!');
        } else if (ask === '3') {
            process.exit()
        }
        
        let caption;
        const listUserCourse = await getUserCourse()
        caption = listUserCourse.map((course, idx) => `${idx + 1}. ${course.title} (${course.id})`).join('\n')
        const id = await question(`\n[ List Subcribed Course ]\n\n${caption}\n\nSelect course above (ex: 1): `)

        const course = listUserCourse[id - 1]
        if (!course) {
            console.log('Course not found');
            return
        }

        //const courseId = '473160'
        let data = await getAllCourse(course.id)

        let listCourse = {}

        await data.curriculum_context.data.sections.forEach(section => {
            let title = section.title
            let listLecture = section.items.map(lecture => {
                return {
                    title: lecture.title,
                    id: lecture.id
                }
            })

            listCourse[title] = listLecture
        });

        caption = Object.keys(listCourse).map((key, idxs) => {
            let cap = `\n\n[ ${key} ]\n`;
            cap += `${idxs + 1}-0. All this section\n`;
            cap += listCourse[key].map((lecture, idx) => {
                return `${idxs + 1}-${idx + 1}. ${lecture.title} (${lecture.id})`;
            }).join('\n');
            return cap;
        }).join('');

        let index = await question(`${caption}\n\nSelect lecture above (ex: 1-1): `)

        const regex = /^(\d+-\d+)$/;

        if (!regex.test(index)) {
            console.log('Index not valid.');
            return;
        }

        await processCourses(index, course.id, listCourse, course.clean_title)
    } catch (error) {
        console.error(error);
    } finally {
        main()
    }
}

main()