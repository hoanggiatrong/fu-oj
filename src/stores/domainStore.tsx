import * as http from '../lib/httpRequest';

export const APP_BASE_API_URL = 'https://api.nhatnuoc.com/';

class DomainStore {
    private readonly baseUrls = {};

    default = () => {
        http.get('');
        this.baseUrls;
    };
}

export default new DomainStore();
