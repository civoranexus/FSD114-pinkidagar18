try {
    const routes = [
        './routes/authRoutes',
        './routes/courseRoutes',
        './routes/Enrollmentroutes',
        './routes/progressRoutes',
        './routes/Assignmentroutes',
        './routes/Attendanceroutes',
        './routes/Certificateroutes',
        './routes/Classroutes',
        './routes/Adminroutes',
        './routes/aiRoutes',
        './routes/TeacherRoutes'
    ];

    routes.forEach(route => {
        console.log(`Testing ${route}...`);
        require(route);
        console.log(`✅ ${route} loaded.`);
    });

    console.log('All routes loaded successfully!');
} catch (error) {
    console.error('DIAGNOSTIC FAILED:');
    console.error(error);
    process.exit(1);
}
