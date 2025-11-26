import { makeAutoObservable } from 'mobx';
import * as http from '../../lib/httpRequest';
import authentication from '../../shared/auth/authentication';

export type HSCode = {
    code: string;
    description_vi: string;
    unit: string;
};

class GlobalDataStore {
    submissions: any = null;
    exams: any = null;

    constructor() {
        makeAutoObservable(this);
    }

    init = (profile: any) => {
        const role = profile?.data?.role;

        if (role == 'STUDENT') {
            http.get(`/submissions?student=${authentication.account?.data.id}&pageSize=99999`).then((res) => {
                this.setSubmissions(res.data);
            });
        } else if (role == 'INSTRUCTOR') {
            http.get(`/exams`).then((res) => {
                this.setExams(res.data);
            });
        }
    };

    setSubmissions = (submissions: any) => {
        this.submissions = submissions;
    };

    setExams = (exams: any) => {
        this.exams = exams;
    };
}

export default new GlobalDataStore();
