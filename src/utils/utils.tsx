type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];
import type { GetProp, UploadProps } from 'antd';
import { message } from 'antd';
import moment from 'moment';

class Utils {
    capitalizeFirstLetter(word: string): string {
        if (!word) return '';
        return word[0].toUpperCase() + word.slice(1).toLowerCase();
    }

    getMonthShortName(monthNumber: number): string {
        const monthIndex = monthNumber - 1; // Date uses 0-based index
        const date = new Date(2020, monthIndex, 1); // năm bất kỳ, ngày 1
        return date.toLocaleString('en-US', { month: 'short' }); // buộc tiếng Anh
    }

    getDifficultyClass = (difficulty: string) => {
        const formatted =
            difficulty.length > 4
                ? this.capitalizeFirstLetter(difficulty).slice(0, 4) + '.'
                : this.capitalizeFirstLetter(difficulty);

        return difficulty == 'EASY' ? (
            <div className="color-cyan">{formatted}</div>
        ) : difficulty == 'MEDIUM' ? (
            <div className="color-gold">{formatted}</div>
        ) : (
            <div className="color-red">{formatted}</div>
        );
    };

    getColor = (str: string) => {
        if (str == 'ACCEPTED') return <span className="p-4 br-medium light-bold bg-cyan color-white">{str}</span>;

        return <span className="p-4 br-medium light-bold bg-red color-white">{str}</span>;
    };

    getRandomInt(max: number): number {
        return Math.floor(Math.random() * max);
    }

    beforeUpload = (file: FileType) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
            message.error('You can only upload JPG/PNG file!');
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('Image must smaller than 2MB!');
        }
        return isJpgOrPng && isLt2M;
    };

    getBase64 = (img: FileType, callback: (url: string) => void) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => callback(reader.result as string));
        reader.readAsDataURL(img);
    };

    formatDate = (date?: any, format: any = 'DD/MM/YYYY HH:mm', defaultEmpty: string = '') => {
        if (!date) {
            return defaultEmpty;
        } else {
            let data = moment(date);
            if (data.isValid()) {
                return moment(date).format(format);
            } else {
                return defaultEmpty;
            }
        }
    };

    copyToClipBoard = (str: string) => {
        navigator.clipboard.writeText(str);
    };
}

export default new Utils();
