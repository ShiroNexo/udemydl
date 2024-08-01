# Udemy Course Downloader

This is an expert-level Node.js script that allows you to download your purchased Udemy courses for offline viewing. It provides a command-line interface to select and download specific lectures or entire course sections.

## Features

- Download individual lectures or entire course sections
- Select video quality
- Download subtitles (if available)
- Batch download functionality
- User-friendly command-line interface

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js (v12.0.0 or higher)
- npm (usually comes with Node.js)
- A valid Udemy account with purchased courses

## Installation

Download this package globally:
```
npm i -g udemy-course-downloader
```

## Usage

Run the script using cmd/powershell:

```
udemydl
```

For easy locate cmd just go to any folder then in path bar just type (<kbd>cmd</kbd>) and hit enter

![opening_cmd](https://i.ibb.co.com/XpshtXv/Screenshot-2024-07-31-171026.png)


Follow the on-screen prompts to:
1. Select whether to download courses, replace your cookie, or exit
2. Choose a course from your subscribed courses
3. Select a specific lecture or entire section to download
4. Choose video quality and subtitle options (if available)

The downloaded content will be saved in a folder structure that mirrors the course structure on Udemy.


### How To Get Cookie:
1. Login to udemy using your account
2. Open the developer tools (<kbd>F12</kbd>, <kbd>Ctrl+Shift+I</kbd>, or <kbd>Cmd+J</kbd>)
3. Go to the `Application` tab
4. Go to the `Storage` section and click on `Cookies`
5. Look for the `access_token`
6. Open the object, right click on value and copy your access_token.

![access_token](https://i.ibb.co.com/QXw2w0v/Screenshot-2024-07-31-170809.png)


## Limitations

- This script is for personal use only. Please respect Udemy's terms of service and do not distribute downloaded content.
- The script can only download courses you have purchased and have access to.
- Some courses may have DRM protection that prevents downloading.

## Contributing

Contributions to this project are welcome. Please fork the repository and submit a pull request with your changes.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Disclaimer

This script is not officially associated with Udemy. Use it at your own risk. The developers are not responsible for any misuse or any violations of Udemy's terms of service.

## Acknowledgements

- Thanks to the Udemy platform for providing valuable educational content.