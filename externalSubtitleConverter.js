export class ExternalSubtitleConverter {
    constructor (selectedMedia) {
        this.selectedMedia = selectedMedia;
        this.ttmlPrefix = `<?xml version="1.0" encoding="utf-8"?>
            <tt xmlns="http://www.w3.org/ns/ttml" xmlns:ttp="http://www.w3.org/ns/ttml#parameter" xmlns:tts="http://www.w3.org/ns/ttml#styling" xmlns:ttm="http://www.w3.org/ns/ttml#metadata" xmlns:xml="http://www.w3.org/XML/1998/namespace" ttp:timeBase="media" ttp:frameRate="24" xml:lang="en">
                <head>
                    <metadata>
                        <ttm:title>Sample TTML</ttm:title>
                    </metadata>
                    <styling>
                        <style xml:id="s1" tts:textAlign="center" tts:fontFamily="Arial" tts:fontSize="100%"/>
                    </styling>
                    <layout>
                        <region xml:id="bottom" tts:displayAlign="after" tts:extent="80% 40%" tts:origin="10% 50%"/>
                        <region xml:id="top" tts:displayAlign="before" tts:extent="80% 40%" tts:origin="10% 10%"/>
                    </layout>
                </head>
            <body>
            <div>\n`;
        this.ttmlSuffix = `\n</div></body></tt>`;
    }

    convert() {
        try {
            const fileName = this.selectedMedia.name; // name: "thegirl.mp4"
            const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')); // "thegirl"
            const filePath = this.selectedMedia.details.path; // path: "/media/sda1/"
            const ttmlName = `${ fileNameWithoutExt }.ttml`; // "thegirl.ttml"
            const srtName = `${ fileNameWithoutExt }.srt`; // "thegirl.srt"

            const param = document.createElement('param');
            param.name = 'subtitles';
            param.value = `src: http://localhost${ filePath + ttmlName } label: ${ fileNameWithoutExt}`;

            if (StorageManager.getFileExistence(filePath + ttmlName)) {
                return param;
            } else if (StorageManager.getFileExistence(filePath + srtName)) {
                const srtFile = FileManager.readFile(filePath + srtName, 0, StorageManager.getFileSize(filePath + srtName) * 1024);
                const ttmlString = this.subsToTTML(this.srtToSubs(srtFile));
                const result = FileManager.writeFile(ttmlString, filePath + ttmlName, 0, FileManager.FILE_WRITE_MODE_TRUNCATE, 0, new Blob([ttmlString]).size * 1024);
            
                if (result === FileManager.NO_ERROR) 
                    return param;
            }
        } catch (_) { } 
        return null;
    }

    srtToSubs(srtString) {
        return srtString.trim().split(/\n\n/).map(function(subPiece) {
            var outerParts = subPiece.split(/\r\n\r\n/);
            return outerParts.map(function(op) {
                var innerParts = op.split(/\r\n/);
                var timecodes = innerParts[1].split(' --> ');
                return {
                    id: innerParts[0],
                    begin: timecodes[0],
                    end: timecodes[1],
                    content: innerParts.slice(2).map(i => i.replace(/<\/?[^>]+(>|$)/g, ""))
                };
            }); 
        });
    }
    
    subsToTTML(subsArray) {
        return this.ttmlPrefix + subsArray[0].map(function(sub) {
            return `<p xml:id="subtitle${ sub.id }" begin="${ sub.begin.replace(',', '.') }" end="${ sub.end.replace(',', '.') }" style="s1" region="bottom"><span>${ sub.content.join('<br/>') }</span></p>`;
        }).join('\n') + this.ttmlSuffix;
    }

}
export default ExternalSubtitleConverter;