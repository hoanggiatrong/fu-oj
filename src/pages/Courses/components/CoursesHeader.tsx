interface CoursesHeaderProps {
    title: string;
    description: string;
}

const CoursesHeader = ({ title, description }: CoursesHeaderProps) => {
    return (
        <div className="header">
            <div className="title">{title}</div>
            <div className="description">{description}</div>
        </div>
    );
};

export default CoursesHeader;

