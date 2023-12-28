import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface PluginSettings {
	autoReplace: boolean;
}

const DEFAULT_SETTINGS: PluginSettings = {
	autoReplace: true
}

export default class YouTubeLinkWithTitleReplacer extends Plugin {
	settings: PluginSettings;

    async onload() {
        console.log('loading YouTubeLinkReplacer');
		await this.loadSettings();

        this.registerCodeMirror((cm) => {
            cm.on("change", this.handleTextChange.bind(this));
        });

		this.addSettingTab(new SettingTab(this.app, this));
    }

    async handleTextChange(doc, change) {
		const youtubeRegex = /(?<!\()https:\/\/www\.youtube\.com\/watch\?v=([\w-]+)(?!\))/gi;
        const text = doc.getValue();

        let match;
        while ((match = youtubeRegex.exec(text)) !== null) {
            const videoId = match[1];
            const videoTitle = await this.fetchVideoTitle(videoId);
            
            if (videoTitle) {
                const replaceText = `[${videoTitle}](https://www.youtube.com/watch?v=${videoId})`;
                doc.replaceRange(replaceText, change.from, change.to);
            }
        }
    }

    async fetchVideoTitle(videoId: string) {
        const apiKey = 'YOUR_YOUTUBE_API_KEY';
        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet`;

        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
            return data.items[0].snippet.title;
        }

        return null;
    }

    onunload() {
        console.log('unloading YouTubeLinkReplacer');
    }	

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

//	alternative
// import fetch from 'node-fetch';

// const VideoID: string = "SZj6rAYkYOg";

// const params: { [key: string]: string } = {
//     format: "json",
//     url: `https://www.youtube.com/watch?v=${VideoID}`
// };

// const baseURL: string = "https://www.youtube.com/oembed";
// const url: string = `${baseURL}?${new URLSearchParams(params).toString()}`;

// fetch(url)
//     .then(response => {
//         if (!response.ok) {
//             throw new Error("Network response was not ok");
//         }
//         return response.json();
//     })
//     .then(data => {
//         console.log(data);
//         console.log(data.title);
//     })
//     .catch(error => {
//         console.error("There was a problem with the fetch operation:", error.message);
//     });


class SettingTab extends PluginSettingTab {
	plugin: YouTubeLinkWithTitleReplacer;

	constructor(app: App, plugin: YouTubeLinkWithTitleReplacer) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addToggle(toggle => toggle				
				.setValue(this.plugin.settings.autoReplace)
				.onChange(async (value) => {
					this.plugin.settings.autoReplace = value;
					await this.plugin.saveSettings();
				}));
	}
}