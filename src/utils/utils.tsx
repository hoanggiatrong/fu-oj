type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];
import type { GetProp, UploadProps } from 'antd';
import { message } from 'antd';
import moment from 'moment';
import globalDataStore from '../components/GlobalComponent/globalDataStore';
import numeral from 'numeral';
import { visbilities, type Visibility } from '../constants/visibility';
import { difficulties, type Difficulty } from '../constants/difficulty';

const reEmail =
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

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

    getDifficultyClass = (val: string) => {
        return <div className={difficulties[val as Difficulty].className}>{difficulties[val as Difficulty].text}</div>;
    };

    getDifficultyBackground = (val: string) => {
        return (
            <div className={difficulties[val as Difficulty].bgClassName}>{difficulties[val as Difficulty].text}</div>
        );
    };

    getVisibilityClass = (val: string) => {
        return <div className={visbilities[val as Visibility].className}>{visbilities[val as Visibility].text}</div>;
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

    formatDateVN = (date?: string, format: string = 'DD/MM/YYYY HH:mm', defaultEmpty: string = ''): string => {
        if (!date) return defaultEmpty;

        const m = moment.utc(date).local().locale('vi'); // UTC -> local time Việt Nam
        return m.isValid() ? m.format(format) : defaultEmpty;
    };

    formatNumber = (data: number, precision: number = 2, _default: string = '0'): string => {
        if (data == null || isNaN(data) || !isFinite(data)) return _default;

        const fixedPrecision = Math.max(0, precision); // đảm bảo không âm
        const formatString = '0,0.' + '0'.repeat(fixedPrecision); // tạo chuỗi định dạng, ví dụ: '0,0.00'

        const formatted = numeral(data).format(formatString);

        // Nếu kết quả là 'NaN', trả về giá trị mặc định
        return formatted === 'NaN' ? _default : formatted;
    };

    copyToClipBoard = (str: string) => {
        navigator.clipboard.writeText(str);
    };

    getDates = () => {
        let dates: string[] = [];

        if (globalDataStore.submissions) {
            dates = globalDataStore.submissions.map((submission: any) => {
                return this.formatDate(submission.createdTimestamp, 'YYYY/MM/DD');
            });
        }

        if (globalDataStore.exams) {
            let from = new Date().getTime();
            let to = new Date().getTime();

            globalDataStore.exams.map((exam: any) => {
                const startTime = new Date(exam.startTime).getTime();
                const endTime = new Date(exam.endTime).getTime();
                if (startTime < from) from = startTime;
                if (endTime > to) to = endTime;
            });

            dates = this.getDatesBetween(from, to).map((db: any) => this.formatDate(db, 'YYYY/MM/DD')) || [];
        }

        return dates;
    };

    getDatesBetween(startMs: number, endMs: number) {
        const dates = [];

        // Chuyển thành Date
        const start = new Date(startMs);
        const end = new Date(endMs);

        // Đưa thời gian về 00:00 để dễ xử lý
        let current = new Date(start.getFullYear(), start.getMonth(), start.getDate());

        const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());

        while (current <= last) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        return dates;
    }

    getDateTheWeekBefore(date: Date = new Date(), weeks: number = 1) {
        date.setDate(date.getDate() - weeks * 7);
        return date;
    }

    s4 = () => {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    };

    getGUID = () => {
        return (
            this.s4() +
            this.s4() +
            '-' +
            this.s4() +
            '-' +
            this.s4() +
            '-' +
            this.s4() +
            '-' +
            this.s4() +
            this.s4() +
            this.s4()
        );
    };

    isEmail = (email: string) => {
        return reEmail.test(email);
    };
}

export default new Utils();
