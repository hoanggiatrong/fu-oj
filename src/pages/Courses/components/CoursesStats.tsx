interface CourseStat {
    label: string;
    value: string | number;
}

interface CoursesStatsProps {
    stats: CourseStat[];
}

const CoursesStats = ({ stats }: CoursesStatsProps) => {
    return (
        <div className="courses-stats">
            {stats.map((stat) => (
                <div key={stat.label} className="stat-item">
                    <div className="stat-label">{stat.label}</div>
                    <div className="stat-value">{stat.value}</div>
                </div>
            ))}
        </div>
    );
};

export type { CourseStat };
export default CoursesStats;

