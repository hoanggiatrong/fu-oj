class Utils {
    capitalizeFirstLetter(word: string): string {
        if (!word) return '';
        return word[0].toUpperCase() + word.slice(1).toLowerCase();
    }
}

export default new Utils();
