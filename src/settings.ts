import { App, PluginSettingTab, Setting, Notice, TextComponent, AbstractInputSuggest, TFolder } from 'obsidian';
import type LinguaFlowPlugin from './main';

/**
 * 语音服务提供商
 */
export type SpeechProvider = 'openai' | 'azure' | 'assemblyai' | 'custom';

/**
 * LinguaFlow 插件设置
 */
export interface LinguaFlowSettings {
	// 启用/禁用语音转文字
	enableVoice2Text: boolean;          // 启用语音转文字功能
	
	// 语音服务提供商选择
	speechProvider: SpeechProvider;     // 'openai' | 'azure' | 'assemblyai' | 'custom'
	
	// 通用语音转文字设置
	sttApiKey: string;                  // API Key（所有提供商）
	sttLanguage: string;                // 语言代码（如 'en', 'zh-CN'，空=自动检测）
	sttModel: string;                   // 模型名称（OpenAI: whisper-1）
	sttBaseUrl: string;                 // 自定义 API 端点 或 Azure Region
	
	// 音频设置
	saveAudio: boolean;                 // 是否保存录音文件
	audioFolder: string;                // 录音保存文件夹
	audioFormat: 'wav' | 'webm' | 'mp3'; // 音频文件格式
	recordOnlyMode: boolean;            // 只录音不转录模式
	
	// 播放器设置
	loopCount: number;                  // 单句循环次数（播放几次）
	autoPlayNext: boolean;              // 循环完成后自动播放下一句
	playerHeight: number;               // 播放器高度（像素）
	subtitleWidth: number;              // 右侧布局时字幕宽度（像素）
	videoFit: 'contain' | 'cover' | 'fill';  // 视频填充模式
	showInlineSubtitles: boolean;       // 是否在视频下方显示字幕列表

	// 字幕样式设置
	subtitleFontSize: number;           // 字幕字体大小（px）
	subtitleFontWeight: string;         // 字幕字重
	subtitleLineHeight: number;         // 字幕行高
	subtitleColor: string;              // 字幕颜色
	subtitleTranslationColor: string;   // 翻译字幕颜色
	subtitleBackgroundColor: string;    // 字幕背景色
	subtitleHighlightColor: string;     // 高亮颜色
	showIndexAndTime: boolean;          // 是否显示字幕编号和时间
	wordByWordHighlight: boolean;       // 逐字高亮（true）或整行高亮（false）
	visibleLanguages: string[];         // 可见语言列表 (e.g. ['en', 'zh'])
	subtitlePanelLocation: 'right' | 'left' | 'tab' | 'split'; // 字幕面板打开位置
	subtitleLayout: 'bottom' | 'right'; // 内嵌字幕布局：底部或右侧


	// Language Learner 集成设置
	openLanguageLearnerPanel: boolean;  // 查词时是否自动打开录入面板
	autoCopyWordOnLookup: boolean;      // 查词时自动复制单词到剪切板
	notePath: string;                   // 学习笔记默认路径
	noteTemplate: string;               // 视频笔记模板

	// 兼容性字段（向后兼容）
	openaiApiKey: string;               // 已废弃，使用 sttApiKey
	azureSubscriptionKey: string;       // 已废弃，使用 sttApiKey
	azureRegion: string;                // 已废弃，使用 sttBaseUrl

	// 快捷键设置 (Key name or Modifier+Key)
	hotkeys: {
		prevSubtitle: string;
		nextSubtitle: string;
		rewind: string;
		fastForward: string;
		playPause: string;
		record: string;
	};

	// 调试模式（开发者选项）
	debugMode: boolean;
}

/**
 * 默认笔记模板 (科学学习版)
 */
const DEFAULT_NOTE_TEMPLATE = `---
type: video-study
status: learning
tags: [langplayer, video-note]
created: {{date}}
source: {{url}}
---

# 📺 {{title}}

> [!INFO|clean] Metadata
> **Link**: {{link}}
> **Date**: {{date}}

## 🧠 学习区 (Study Area)

> [!QUESTION] 核心问题 / 线索
> - [ ] 00:00 这里的连读是怎么发的？
> - [ ] 单词: **example**

> [!NOTE] 笔记与回答
> 在这里记录你的理解...

---

## 📝 词汇积累 (Vocabulary)

| Word | Definition | Context |
| :--- | :--- | :--- |
|      |      |      |

---

## 🗣️ 口语训练 (Speaking)
> [!quote] 影子跟读 (Shadowing)
> 复制你想模仿的金句到这里...

---

## 💡 总结 (Summary)
> [!abstract]
> 用自己的话总结这个视频讲了什么...
`;

/**
 * 默认设置
 */
export const DEFAULT_SETTINGS: LinguaFlowSettings = {
	enableVoice2Text: true,
	speechProvider: 'openai',
	sttApiKey: '',
	sttLanguage: '',                    // 空=自动检测
	sttModel: 'whisper-1',
	sttBaseUrl: '',
	// 音频设置
	saveAudio: false,
	audioFolder: 'Recordings',
	audioFormat: 'webm',
	recordOnlyMode: false,
	// 播放器设置
	loopCount: 3, // 默认循环3次（播放3遍）
	autoPlayNext: false, // 默认不自动播放下一句
	playerHeight: 400, // 默认播放器高度 400px
	subtitleWidth: 400, // 默认字幕宽度 400px
	videoFit: 'cover', // 默认填充模式：填满容器无黑边
	showInlineSubtitles: true, // 默认显示内嵌字幕列表
	// 字幕样式设置
	subtitleFontSize: 15, // 默认字体大小 15px
	subtitleFontWeight: '500', // 默认字重
	subtitleLineHeight: 1.6, // 默认行高
	subtitleColor: '', // 默认跟随主题
	subtitleTranslationColor: '', // 默认跟随主题
	subtitleBackgroundColor: '', // 默认无背景
	subtitleHighlightColor: '', // 默认跟随主题
	showIndexAndTime: false, // 默认隐藏编号和时间
	wordByWordHighlight: false, // 默认关闭逐字高亮（整行高亮）
	visibleLanguages: ['en', 'zh'], // 默认显示英文和中文
	subtitlePanelLocation: 'tab', // 默认在新标签页打开（可拖动）

	subtitleLayout: 'bottom', // 默认底部布局
	// Language Learner 集成设置
	openLanguageLearnerPanel: true, // 默认打开录入面板
	autoCopyWordOnLookup: true, // 默认开启查词自动复制
	notePath: '', // 默认根目录
	noteTemplate: DEFAULT_NOTE_TEMPLATE,
	// 兼容性字段
	openaiApiKey: '',
	azureSubscriptionKey: '',
	azureRegion: 'eastus',
	// 默认快捷键
	hotkeys: {
		prevSubtitle: 'ArrowLeft',
		nextSubtitle: 'ArrowRight',
		rewind: 'Shift+ArrowLeft',
		fastForward: 'Shift+ArrowRight',
		playPause: ' ',
		record: 'r'
	},

	// 默认关闭调试模式
	debugMode: false
};

// 预设主题配置
const SUBTITLE_THEMES = [
	{
		id: 'modern_glass',
		name: '✨ 现代玻璃',
		desc: '纯净白字，蓝色高亮',
		config: {
			subtitleColor: '#FFFFFF',
			subtitleBackgroundColor: '', // 无背景
			subtitleTranslationColor: '#CCCCCC',
			subtitleHighlightColor: '#4A9EFF',
			subtitleFontSize: 16,
			subtitleFontWeight: '500'
		},
		previewBg: 'linear-gradient(135deg, #222 0%, #444 100%)' // 模拟深色视频背景
	},
	{
		id: 'netflix_focus',
		name: '🎬 奈飞经典',
		desc: '明黄字，沉浸观影',
		config: {
			subtitleColor: '#FFD700', // Gold
			subtitleBackgroundColor: '', // 无背景
			subtitleTranslationColor: '#AAAAAA',
			subtitleHighlightColor: '#FFFFFF',
			subtitleFontSize: 18,
			subtitleFontWeight: '600'
		},
		previewBg: '#000000'
	},
	{
		id: 'soft_study',
		name: '🌿 护眼学习',
		desc: '深灰字，墨绿高亮',
		config: {
			subtitleColor: '#333333',
			subtitleBackgroundColor: '', // 无背景
			subtitleTranslationColor: '#666666',
			subtitleHighlightColor: '#2E8B57', // SeaGreen
			subtitleFontSize: 16,
			subtitleFontWeight: '500'
		},
		previewBg: '#F5F5DC' // 模拟浅色背景（如白板视频或文档）
	},
	{
		id: 'cyber_neon',
		name: '⚡ 赛博霓虹',
		desc: '青色字，粉红高亮',
		config: {
			subtitleColor: '#00FFFF', // Cyan
			subtitleBackgroundColor: '', // 无背景
			subtitleTranslationColor: '#008888',
			subtitleHighlightColor: '#FF00FF', // Magenta
			subtitleFontSize: 15,
			subtitleFontWeight: '500'
		},
		previewBg: '#111'
	}
];

/**
 * LinguaFlow 设置选项卡
 */
export class LinguaFlowSettingTab extends PluginSettingTab {
	plugin: LinguaFlowPlugin;
	private activeTab: string = 'audio';

	constructor(app: App, plugin: LinguaFlowPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		
		const timestamp = new Date().toLocaleTimeString();
		// console.log(`[LangPlayer] Settings Displayed at ${timestamp}`);

		// 标题
		containerEl.createEl('h2', { text: `LangPlayer Settings` });

		// 标签页导航
		const tabsContainer = containerEl.createDiv({ cls: 'linguaflow-tabs' });
		const tabs = [
		{ id: 'audio', name: '音频' },
			{ id: 'player', name: '播放器' },
			{ id: 'subtitle', name: '字幕' },
			{ id: 'integration', name: '集成' }
			// { id: 'developer', name: '开发者' } // 暂时隐藏
		];

		tabs.forEach(tab => {
			const tabEl = tabsContainer.createDiv({
				cls: `linguaflow-tab ${this.activeTab === tab.id ? 'active' : ''}`
			});
			tabEl.setText(tab.name);
			tabEl.onclick = () => {
				this.activeTab = tab.id;
				this.display();
			};
		});

		// 标签页内容区域
		const contentContainer = containerEl.createDiv({ cls: 'linguaflow-tab-content' });

		// 根据活动标签显示内容
		if (this.activeTab === 'audio') {
			this.displayAudioTab(contentContainer);
		} else if (this.activeTab === 'player') {
			this.displayPlayerTab(contentContainer);
		} else if (this.activeTab === 'subtitle') {
			this.displaySubtitleTab(contentContainer);
		} else if (this.activeTab === 'integration') {
			this.displayIntegrationTab(contentContainer);
} else if (this.activeTab === 'developer') {
			this.displayDeveloperTab(contentContainer);
		}
		
		// 【调试】无论哪个标签页，都在最底部强制渲染集成设置，看是否会出现
		// containerEl.createEl('hr');
		// containerEl.createEl('h3', { text: 'DEBUG: Forced Integration View', style: 'color: red;' });
		// this.displayIntegrationTab(containerEl);
	}

	private displayAudioTab(containerEl: HTMLElement): void {

		new Setting(containerEl)
			.setName('启用语音转文字')
			.setDesc('')
			.setTooltip('录音并转写为笔记(需配置 API)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableVoice2Text)
				.onChange(async (value) => {
					this.plugin.settings.enableVoice2Text = value;
					await this.plugin.saveSettings();
					this.display(); // 重新渲染
				})
			);

		// 如果未启用，返回
		if (!this.plugin.settings.enableVoice2Text) {
			return;
		}

		// ===== 语音服务商 =====
		containerEl.createEl('h3', { text: '语音服务商' });

		new Setting(containerEl)
			.setName('服务提供商')
			.setDesc('')
			.setTooltip('选择转录服务。OpenAI: 高精度 (Whisper)。Azure: 企业级。')
			.addDropdown(dropdown => dropdown
				.addOption('openai', 'OpenAI (Whisper)')
				.addOption('azure', 'Azure Speech Services')
				.addOption('assemblyai', 'AssemblyAI')
				.addOption('custom', 'Custom (OpenAI-compatible)')
				.setValue(this.plugin.settings.speechProvider)
				.onChange(async (value: SpeechProvider) => {
					this.plugin.settings.speechProvider = value;
					await this.plugin.saveSettings();
					this.display(); // 重新渲染以显示对应的设置
				})
			);

		const provider = this.plugin.settings.speechProvider;

		// API Key
		let apiKeyText: TextComponent;
		new Setting(containerEl)
			.setName('API Key')
			.setDesc('')
			.setTooltip('仅本地存储,直连服务商')
			.addText(text => {
				apiKeyText = text;
				text
					.setPlaceholder(provider === 'openai' ? 'sk-...' : 'Enter API Key')
					.setValue(this.plugin.settings.sttApiKey || this.plugin.settings.openaiApiKey)
					.onChange(async (value) => {
						this.plugin.settings.sttApiKey = value;
						// 同步到旧字段以保持兼容性
						if (provider === 'openai') this.plugin.settings.openaiApiKey = value;
						if (provider === 'azure') this.plugin.settings.azureSubscriptionKey = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.type = 'password';
			})
			.addExtraButton(btn => {
				btn.setIcon('eye-off')
					.setTooltip('显示 API Key')
					.onClick(() => {
						if (apiKeyText.inputEl.type === 'password') {
							apiKeyText.inputEl.type = 'text';
							btn.setIcon('eye');
							btn.setTooltip('隐藏 API Key');
						} else {
							apiKeyText.inputEl.type = 'password';
							btn.setIcon('eye-off');
							btn.setTooltip('显示 API Key');
						}
					});
			})
			.addButton(button => button
				.setButtonText('Test Connection')
				.setTooltip('测试 API 连接')
				.onClick(async () => {
					button.setDisabled(true);
					button.setButtonText('Testing...');
					try {
						await this.testConnection();
						button.setButtonText('✓ Success');
						setTimeout(() => button.setButtonText('Test Connection'), 2000);
					} catch (error) {
						button.setButtonText('✗ Failed');
						setTimeout(() => button.setButtonText('Test Connection'), 2000);
					} finally {
						button.setDisabled(false);
					}
				})
			);

		// Azure Region - 下拉选择
		if (provider === 'azure') {
			new Setting(containerEl)
				.setName('Azure Region')
				.setDesc('')
				.setTooltip('选择 Azure 服务区域')
				.addDropdown(dropdown => dropdown
					.addOption('eastus', 'East US')
					.addOption('eastus2', 'East US 2')
					.addOption('westus', 'West US')
					.addOption('westus2', 'West US 2')
					.addOption('centralus', 'Central US')
					.addOption('northcentralus', 'North Central US')
					.addOption('southcentralus', 'South Central US')
					.addOption('westcentralus', 'West Central US')
					.addOption('canadacentral', 'Canada Central')
					.addOption('brazilsouth', 'Brazil South')
					.addOption('northeurope', 'North Europe')
					.addOption('westeurope', 'West Europe')
					.addOption('uksouth', 'UK South')
					.addOption('francecentral', 'France Central')
					.addOption('germanywestcentral', 'Germany West Central')
					.addOption('switzerlandnorth', 'Switzerland North')
					.addOption('norwayeast', 'Norway East')
					.addOption('eastasia', 'East Asia')
					.addOption('southeastasia', 'Southeast Asia')
					.addOption('australiaeast', 'Australia East')
					.addOption('japaneast', 'Japan East')
					.addOption('japanwest', 'Japan West')
					.addOption('koreacentral', 'Korea Central')
					.addOption('centralindia', 'Central India')
					.addOption('southafricanorth', 'South Africa North')
					.addOption('uaenorth', 'UAE North')
					.setValue(this.plugin.settings.sttBaseUrl || this.plugin.settings.azureRegion || 'eastus')
					.onChange(async (value) => {
						this.plugin.settings.sttBaseUrl = value;
						this.plugin.settings.azureRegion = value;
						await this.plugin.saveSettings();
					})
				);
		} else if (provider === 'custom') {
			new Setting(containerEl)
				.setName('API Base URL')
				.setDesc('')
				.setTooltip('自定义 API 端点（OpenAI 兼容接口）')
				.addText(text => text
					.setPlaceholder('https://your-api.com/v1/audio/transcriptions')
					.setValue(this.plugin.settings.sttBaseUrl)
					.onChange(async (value) => {
						this.plugin.settings.sttBaseUrl = value;
						await this.plugin.saveSettings();
					})
				);
		}

		new Setting(containerEl)
			.setName('语言')
			.setDesc('')
			.setTooltip('目标语言代码,如 en, zh。留空自动检测。')
			.addText(text => text
				.setPlaceholder('自动检测')
				.setValue(this.plugin.settings.sttLanguage)
				.onChange(async (value) => {
					this.plugin.settings.sttLanguage = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('模型')
			.setDesc('')
			.setTooltip('AI 模型名称,默认为 whisper-1')
			.addText(text => text
				.setPlaceholder('whisper-1')
				.setValue(this.plugin.settings.sttModel)
				.onChange(async (value) => {
					this.plugin.settings.sttModel = value;
					await this.plugin.saveSettings();
				})
			);

		// ===== 音频文件格式 =====
		new Setting(containerEl)
			.setName('录音文件格式')
			.setDesc('')
			.setTooltip('录音格式。WebM: 体积小 (推荐)。WAV: 无损。')
			.addDropdown(dropdown => dropdown
				.addOption('wav', 'WAV')
				.addOption('webm', 'WebM')
				.addOption('mp3', 'MP3')
				.setValue(this.plugin.settings.audioFormat)
				.onChange(async (value: 'wav' | 'webm' | 'mp3') => {
					this.plugin.settings.audioFormat = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('保存录音文件')
			.setDesc('')
			.setTooltip('开启则保留文件。关闭则仅临时转写。')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.saveAudio)
				.onChange(async (value) => {
					this.plugin.settings.saveAudio = value;
					await this.plugin.saveSettings();
					this.display();
				})
			);

		if (this.plugin.settings.saveAudio) {
			new Setting(containerEl)
				.setName('保存文件夹')
				.setDesc('')
				.setTooltip('录音文件保存的文件夹路径')
				.addText(text => text
					.setPlaceholder('Recordings')
					.setValue(this.plugin.settings.audioFolder)
					.onChange(async (value) => {
						this.plugin.settings.audioFolder = value;
						await this.plugin.saveSettings();
					})
				);
		}

		new Setting(containerEl)
			.setName('只录音不转录')
			.setDesc('')
			.setTooltip('仅作为录音机,不消耗 API')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.recordOnlyMode)
				.onChange(async (value) => {
					this.plugin.settings.recordOnlyMode = value;
					await this.plugin.saveSettings();
				})
			);
	}

	// 播放器标签页
	private displayPlayerTab(containerEl: HTMLElement): void {

		new Setting(containerEl)
			.setName('单句循环次数')
			.setDesc('')
			.setTooltip('每句字幕重复播放的遍数')
			.addDropdown(dropdown => dropdown
				.addOption('1', '1 次')
				.addOption('2', '2 次')
				.addOption('3', '3 次')
				.addOption('5', '5 次')
				.addOption('10', '10 次')
				.addOption('20', '20 次')
				.addOption('50', '50 次')
				.addOption('100', '100 次')
				.setValue(String(this.plugin.settings.loopCount))
				.onChange(async (value) => {
					this.plugin.settings.loopCount = parseInt(value);
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('自动播放下一句')
			.setDesc('')
			.setTooltip('开启则连续播放，关闭则暂停等待')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoPlayNext)
				.onChange(async (value) => {
					this.plugin.settings.autoPlayNext = value;
					await this.plugin.saveSettings();
				})
			);


		new Setting(containerEl)
			.setName('视频填充模式')
			.setDesc('')
			.setTooltip('视频画面填充。Cover: 填满。Contain: 完整。')
			.addDropdown(dropdown => dropdown
				.addOption('contain', 'Contain')
				.addOption('cover', 'Cover')
				.addOption('fill', 'Fill')
				.setValue(this.plugin.settings.videoFit)
				.onChange(async (value: 'contain' | 'cover' | 'fill') => {
					this.plugin.settings.videoFit = value;
					await this.plugin.saveSettings();
					// 实时更新
					const { useMediaStore } = require('./store/mediaStore');
					useMediaStore.getState().setVideoFit(value);
				})
			);


		new Setting(containerEl)
			.setName('显示内嵌字幕列表')
			.setDesc('')
			.setTooltip('在播放器下方显示。建议关闭，使用侧边栏。')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showInlineSubtitles)
				.onChange(async (value) => {
					this.plugin.settings.showInlineSubtitles = value;
					await this.plugin.saveSettings();
					
					// 实时更新
					const { useMediaStore } = require('./store/mediaStore');
					useMediaStore.getState().setShowInlineSubtitles(value);
					
					new Notice(value ? '内嵌字幕列表已开启' : '内嵌字幕列表已关闭');
				})
			);
	}

	// 字幕标签页
	private displaySubtitleTab(containerEl: HTMLElement): void {
		containerEl.createEl('h3', { text: '🎨 主题预设 (一键应用)' });
		containerEl.createEl('p', { text: '点击下方主题可快速应用配色方案，之后可继续手动微调。', cls: 'setting-item-description' });

		const themeContainer = containerEl.createDiv();
		themeContainer.style.display = 'flex';
		themeContainer.style.gap = '10px';
		themeContainer.style.marginBottom = '18px';

		SUBTITLE_THEMES.forEach(theme => {
			const isActive = 
				this.plugin.settings.subtitleColor === theme.config.subtitleColor &&
				this.plugin.settings.subtitleBackgroundColor === theme.config.subtitleBackgroundColor &&
				this.plugin.settings.subtitleTranslationColor === theme.config.subtitleTranslationColor &&
				this.plugin.settings.subtitleHighlightColor === theme.config.subtitleHighlightColor;

			const card = themeContainer.createDiv();
			card.style.cssText = `
				flex: 1;
				min-width: 70px;
				border: 1px solid ${isActive ? 'var(--interactive-accent)' : 'var(--background-modifier-border)'};
				border-radius: 6px;
				overflow: hidden;
				cursor: pointer;
				transition: all 0.2s ease;
				background: var(--background-primary);
				display: flex;
				flex-direction: column;
				${isActive ? 'box-shadow: 0 0 0 1px var(--interactive-accent);' : ''}
			`;
			
			// 添加鼠标悬停提示显示完整描述
			card.title = `${theme.name}\n${theme.desc}`;

			// Visual Preview Area (Compact)
			const previewArea = card.createDiv();
			previewArea.style.cssText = `
				height: 36px;
				width: 100%;
				background: ${theme.previewBg};
				display: flex;
				align-items: center;
				justify-content: center;
			`;

			// Simple Preview Text
			const mainText = previewArea.createDiv();
			mainText.innerText = 'Aa';
			mainText.style.fontSize = '14px';
			mainText.style.fontWeight = 'bold';
			mainText.style.color = theme.config.subtitleColor;

			// Info Area (Compact)
			const info = card.createDiv();
			info.style.padding = '6px 4px';
			info.style.borderTop = '1px solid var(--background-modifier-border)';
			info.style.textAlign = 'center';
			
			if (isActive) {
				info.style.backgroundColor = 'rgba(var(--interactive-accent-rgb), 0.1)';
			}

			const name = info.createDiv();
			name.innerText = theme.name;
			name.style.fontSize = '12px';
			name.style.color = isActive ? 'var(--interactive-accent)' : 'var(--text-normal)';
			name.style.fontWeight = isActive ? 'bold' : 'normal';
			name.style.whiteSpace = 'nowrap';
			name.style.overflow = 'hidden';
			name.style.textOverflow = 'ellipsis';

			// Hover effect
			card.onmouseenter = () => {
				if (!isActive) {
					card.style.borderColor = 'var(--interactive-accent)';
					card.style.transform = 'translateY(-1px)';
				}
			};
			card.onmouseleave = () => {
				if (!isActive) {
					card.style.borderColor = 'var(--background-modifier-border)';
					card.style.transform = 'none';
				}
			};

			// Click Handler
			card.onclick = async () => {
				// Apply Settings
				this.plugin.settings.subtitleColor = theme.config.subtitleColor;
				this.plugin.settings.subtitleBackgroundColor = theme.config.subtitleBackgroundColor;
				this.plugin.settings.subtitleTranslationColor = theme.config.subtitleTranslationColor;
				this.plugin.settings.subtitleHighlightColor = theme.config.subtitleHighlightColor;
				this.plugin.settings.subtitleFontSize = theme.config.subtitleFontSize;
				this.plugin.settings.subtitleFontWeight = theme.config.subtitleFontWeight;

				await this.plugin.saveSettings();
				this.plugin.updateSubtitleStyles();

				// Sync to Store

				const { useMediaStore } = require('./store/mediaStore');
				useMediaStore.getState().updateSubtitleConfig({
					fontColor: theme.config.subtitleColor,
					backgroundColor: theme.config.subtitleBackgroundColor,
					translationColor: theme.config.subtitleTranslationColor,
					highlightColor: theme.config.subtitleHighlightColor
				});

				new Notice(`已应用主题: ${theme.name}`);
				this.display(); // Refresh UI to show new values in pickers
			};
		});

		containerEl.createEl('hr');

		new Setting(containerEl)
			.setName('字体大小')
			.setDesc('')
			.setTooltip('字幕大小 (px)')
			.addSlider(slider => slider
				.setLimits(12, 24, 1)
				.setValue(this.plugin.settings.subtitleFontSize)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.subtitleFontSize = value;
					await this.plugin.saveSettings();
					this.plugin.updateSubtitleStyles();
				})
			);

		new Setting(containerEl)
			.setName('字重')
			.setDesc('')
			.setTooltip('字体粗细。400 (常规) | 700 (粗体)')
			.addDropdown(dropdown => dropdown
				.addOption('400', '400')
				.addOption('500', '500')
				.addOption('600', '600')
				.addOption('700', '700')
				.setValue(this.plugin.settings.subtitleFontWeight)
				.onChange(async (value) => {
					this.plugin.settings.subtitleFontWeight = value;
					await this.plugin.saveSettings();
					this.plugin.updateSubtitleStyles();
				})
			);

		new Setting(containerEl)
			.setName('行高')
			.setDesc('')
			.setTooltip('行间距。数值越大越宽。')
			.addSlider(slider => slider
				.setLimits(1.0, 2.5, 0.1)
				.setValue(this.plugin.settings.subtitleLineHeight)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.subtitleLineHeight = value;
					await this.plugin.saveSettings();
					this.plugin.updateSubtitleStyles();
				})
			);

		new Setting(containerEl)
			.setName('字体颜色')
			.setDesc('')
			.setTooltip('设置字幕文字颜色')
			.addColorPicker(color => color
				.setValue(this.plugin.settings.subtitleColor || '#000000')
				.onChange(async (value) => {
					this.plugin.settings.subtitleColor = value;
					await this.plugin.saveSettings();
					this.plugin.updateSubtitleStyles();
					const { useMediaStore } = require('./store/mediaStore');
					useMediaStore.getState().updateSubtitleConfig({ fontColor: value });
				})
			)
			.addExtraButton(btn => btn
				.setIcon('rotate-ccw')
				.setTooltip('重置为主题默认')
				.onClick(async () => {
					this.plugin.settings.subtitleColor = '';
					await this.plugin.saveSettings();
					this.plugin.updateSubtitleStyles();
					const { useMediaStore } = require('./store/mediaStore');
					useMediaStore.getState().updateSubtitleConfig({ fontColor: '' });
					this.display();
				})
			);

		new Setting(containerEl)
			.setName('翻译字幕颜色')
			.setDesc('')
			.setTooltip('设置翻译字幕(如中文)的颜色')
			.addColorPicker(color => color
				.setValue(this.plugin.settings.subtitleTranslationColor || '#888888')
				.onChange(async (value) => {
					this.plugin.settings.subtitleTranslationColor = value;
					await this.plugin.saveSettings();
					this.plugin.updateSubtitleStyles();
					const { useMediaStore } = require('./store/mediaStore');
					useMediaStore.getState().updateSubtitleConfig({ translationColor: value });
				})
			)
			.addExtraButton(btn => btn
				.setIcon('rotate-ccw')
				.setTooltip('重置为默认')
				.onClick(async () => {
					this.plugin.settings.subtitleTranslationColor = '';
					await this.plugin.saveSettings();
					this.plugin.updateSubtitleStyles();
					const { useMediaStore } = require('./store/mediaStore');
					useMediaStore.getState().updateSubtitleConfig({ translationColor: '' });
					this.display();
				})
			);

		new Setting(containerEl)
			.setName('高亮颜色')
			.setDesc('')
			.setTooltip('设置正在播放的字幕高亮颜色')
			.addColorPicker(color => color
				.setValue(this.plugin.settings.subtitleHighlightColor || '#ff0000')
				.onChange(async (value) => {
					this.plugin.settings.subtitleHighlightColor = value;
					await this.plugin.saveSettings();
					this.plugin.updateSubtitleStyles();
					const { useMediaStore } = require('./store/mediaStore');
					useMediaStore.getState().updateSubtitleConfig({ highlightColor: value });
				})
			)
			.addExtraButton(btn => btn
				.setIcon('rotate-ccw')
				.setTooltip('重置为默认 (主题色)')
				.onClick(async () => {
					this.plugin.settings.subtitleHighlightColor = '';
					await this.plugin.saveSettings();
					this.plugin.updateSubtitleStyles();
					const { useMediaStore } = require('./store/mediaStore');
					useMediaStore.getState().updateSubtitleConfig({ highlightColor: '' });
					this.display();
				})
			);

		new Setting(containerEl)
			.setName('背景颜色')
			.setDesc('')
			.setTooltip('设置字幕背景颜色')
			.addColorPicker(color => color
				.setValue(this.plugin.settings.subtitleBackgroundColor || '#000000')
				.onChange(async (value) => {
					this.plugin.settings.subtitleBackgroundColor = value;
					await this.plugin.saveSettings();
					this.plugin.updateSubtitleStyles();
					const { useMediaStore } = require('./store/mediaStore');
					useMediaStore.getState().updateSubtitleConfig({ backgroundColor: value });
				})
			)
			.addExtraButton(btn => btn
				.setIcon('rotate-ccw')
				.setTooltip('重置为默认 (无背景)')
				.onClick(async () => {
					this.plugin.settings.subtitleBackgroundColor = '';
					await this.plugin.saveSettings();
					this.plugin.updateSubtitleStyles();
					const { useMediaStore } = require('./store/mediaStore');
					useMediaStore.getState().updateSubtitleConfig({ backgroundColor: '' });
					this.display();
				})
			);


		new Setting(containerEl)
			.setName('显示编号和时间')
			.setDesc('')
			.setTooltip('显示序号和时间。例：[01] 00:05')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showIndexAndTime)
				.onChange(async (value) => {
					this.plugin.settings.showIndexAndTime = value;
					await this.plugin.saveSettings();
					// 同步更新 store
					const { useMediaStore } = require('./store/mediaStore');
					useMediaStore.getState().updateSubtitleConfig({ showIndexAndTime: value });
				})
			);

		new Setting(containerEl)
			.setName('逐字高亮')
			.setDesc('')
			.setTooltip('卡拉OK效果 (需详细时间戳)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.wordByWordHighlight ?? true)
				.onChange(async (value) => {
					this.plugin.settings.wordByWordHighlight = value;
					await this.plugin.saveSettings();
					// 同步更新 store
					const { useMediaStore } = require('./store/mediaStore');
					useMediaStore.getState().updateSubtitleConfig({ wordByWordHighlight: value });
					new Notice(value ? '✅ 逐字高亮已启用' : '⏹️ 整行高亮已启用');
				})
			);
	}

	// 集成标签页
	private displayIntegrationTab(containerEl: HTMLElement): void {
		console.log('[LangPlayer] displayIntegrationTab called');
		
		new Setting(containerEl)
			.setName('自动打开录入面板')
			.setDesc('')
			.setTooltip('查词时展开侧边栏，方便制卡')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.openLanguageLearnerPanel)
				.onChange(async (value) => {
					this.plugin.settings.openLanguageLearnerPanel = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('查词自动复制到剪切板')
			.setDesc('')
			.setTooltip('查词时复制单词到剪贴板')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoCopyWordOnLookup)
				.onChange(async (value) => {
					this.plugin.settings.autoCopyWordOnLookup = value;
					await this.plugin.saveSettings();
				})
			);

		containerEl.createEl('h3', { text: '学习笔记设置' });

		// 笔记路径设置
		new Setting(containerEl)
			.setName('默认笔记路径')
			.setDesc('')
			.setTooltip('设置学习笔记的默认保存文件夹 (例如: "English/Notes")')
			.addText(text => {
				text
					.setPlaceholder('默认根目录')
					.setValue(this.plugin.settings.notePath || '')
					.onChange(async (value) => {
						this.plugin.settings.notePath = value;
						await this.plugin.saveSettings();
					});
				new FolderSuggest(this.app, text.inputEl);
			});

		// 笔记模板设置
		const setting = new Setting(containerEl)
			.setName('笔记模板')
			.setDesc('')
			.setTooltip('自定义笔记模板')
			.addTextArea(text => {
				text
					.setValue(this.plugin.settings.noteTemplate || DEFAULT_NOTE_TEMPLATE)
					.onChange(async (value) => {
						this.plugin.settings.noteTemplate = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 8;
				text.inputEl.style.width = '100%';
				text.inputEl.style.fontFamily = 'monospace';
			});
			
		// 调试日志
		console.log('[LangPlayer] Template setting created', setting);
	}

	// 开发者标签页
	private displayDeveloperTab(containerEl: HTMLElement): void {
		// 标题和说明
		containerEl.createEl('h3', { text: '调试选项' });
		containerEl.createEl('p', {
			text: '⚠️ 这些选项仅用于开发和调试。启用后可能影响性能。',
			cls: 'setting-item-description'
		});

		// 调试模式开关
		new Setting(containerEl)
			.setName('调试模式')
			.setDesc('启用后将显示详细的调试日志。重新加载插件后生效。')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.debugMode)
				.onChange(async (value) => {
					this.plugin.settings.debugMode = value;
					await this.plugin.saveSettings();
					
					// 动态更新 logger 级别
					const { logger, LogLevel } = require('./utils/logger');
					if (value) {
						logger.enableDebug();
						new Notice('✅ 调试模式已启用，请重新加载插件以应用更改');
					} else {
						logger.disableAll();
						new Notice('✅ 调试模式已关闭，请重新加载插件以应用更改');
					}
				})
			);

		// 性能监控（未来功能）
		containerEl.createEl('h3', { text: '性能监控' });
		containerEl.createEl('p', {
			text: '🚧 功能开发中...',
			cls: 'setting-item-description'
		});
	}

	/**
	 * 测试 API 连接
	 */
	async testConnection(): Promise<void> {
		const provider = this.plugin.settings.speechProvider;
		const apiKey = this.plugin.settings.sttApiKey || this.plugin.settings.openaiApiKey;

		if (!apiKey || !apiKey.trim()) {
			new Notice('❌ Please enter API Key first');
			throw new Error('No API Key');
		}

		try {
			if (provider === 'openai' || provider === 'custom') {
				await this.testOpenAI();
			} else if (provider === 'azure') {
				await this.testAzure();
			} else if (provider === 'assemblyai') {
				await this.testAssemblyAI();
			}
			new Notice('✅ Connection successful!');
		} catch (error: any) {
			console.error('[LinguaFlow] Test connection failed:', error);
			new Notice(`❌ Connection failed: ${error.message || 'Unknown error'}`);
			throw error;
		}
	}

	/**
	 * 测试 OpenAI 连接
	 */
	private async testOpenAI(): Promise<void> {
		const apiKey = this.plugin.settings.sttApiKey || this.plugin.settings.openaiApiKey;
		const baseUrl = this.plugin.settings.sttBaseUrl || 'https://api.openai.com/v1';
		
		// 测试 models API
		const url = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}models`;
		
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${apiKey}`,
			},
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`HTTP ${response.status}: ${error}`);
		}

		const data = await response.json();
		console.log('[LinguaFlow] OpenAI test successful:', data);
	}

	/**
	 * 测试 Azure 连接
	 */
	private async testAzure(): Promise<void> {
		const apiKey = this.plugin.settings.sttApiKey || this.plugin.settings.azureSubscriptionKey;
		const region = this.plugin.settings.sttBaseUrl || this.plugin.settings.azureRegion;

		if (!region || !region.trim()) {
			throw new Error('Please enter Azure Region');
		}

		// 测试 token endpoint
		const url = `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
		
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Ocp-Apim-Subscription-Key': apiKey,
			},
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`HTTP ${response.status}: ${error}`);
		}

		console.log('[LinguaFlow] Azure test successful');
	}

	/**
	 * 测试 AssemblyAI 连接
	 */
	private async testAssemblyAI(): Promise<void> {
		const apiKey = this.plugin.settings.sttApiKey;
		
		// 测试 API 访问
		const response = await fetch('https://api.assemblyai.com/v2/transcript', {
			method: 'GET',
			headers: {
				'Authorization': apiKey,
			},
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`HTTP ${response.status}: ${error}`);
		}

		console.log('[LinguaFlow] AssemblyAI test successful');
	}


}

/**
 * 文件夹建议类
 */
class FolderSuggest extends AbstractInputSuggest<TFolder> {
	private inputEl: HTMLInputElement;

	constructor(app: App, textInputEl: HTMLInputElement) {
		super(app, textInputEl);
		this.inputEl = textInputEl;

		// Auto-select text on focus so user can easily clear it to see all folders
		this.inputEl.addEventListener('focus', () => {
			this.inputEl.select();
		});
	}

	getSuggestions(inputStr: string): TFolder[] {
		const abstractFiles = this.app.vault.getAllLoadedFiles();
		const folders: TFolder[] = [];
		const lowerCaseInputStr = inputStr.toLowerCase();

		abstractFiles.forEach((file: any) => {
			if (file instanceof TFolder) {
				// Match path
				if (file.path.toLowerCase().contains(lowerCaseInputStr)) {
					folders.push(file);
				}
			}
		});

		// Sort by path length (shallower folders first) then alphabetically
		folders.sort((a, b) => {
			const depthA = a.path.split('/').length;
			const depthB = b.path.split('/').length;
			if (depthA !== depthB) return depthA - depthB;
			return a.path.localeCompare(b.path);
		});

		return folders.slice(0, 100); // Limit to 100 results to prevent lag
	}

	renderSuggestion(file: TFolder, el: HTMLElement): void {
		el.setText(file.path);
	}

	selectSuggestion(file: TFolder): void {
		this.inputEl.value = file.path;
		this.inputEl.trigger("input");
		this.close();
	}
}
