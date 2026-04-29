export interface ProductConfig {
	id: string;
	name: string;
	xmlFile: string;
}

export interface SourceAttempt {
	name: string;
	status: 'success' | 'failed';
	ms: number;
}

export interface SourceInfo {
	name: string;
	timestamp?: string;
	attempts: SourceAttempt[];
}

export interface VersionEntry {
	id: string;
	displayVersion: string;
	version: string;
	build: string;
	qualifiers: string[];
}

export interface VersionsResponse {
	versions: VersionEntry[];
	source: SourceInfo;
}

export interface DownloadableFile {
	name: string;
	fileName: string;
	pathFragment: string;
	checksumType?: string;
	checksumValue?: string;
	waybackUrl: string;
	curlCommand: string;
}

export interface FilesResponse {
	files: DownloadableFile[];
	source: SourceInfo;
}

export interface ErrorResponse {
	error: string;
	attempts?: SourceAttempt[];
}
