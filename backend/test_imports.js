const path = require('path');
const fs = require('fs');

console.log('--- Testing Imports ---');

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
    try {
        console.log(`Testing ${route}...`);
        require(route);
        console.log(`✅ ${route} loaded`);
    } catch (err) {
        console.error(`❌ ${route} FAILED:`, err.message);
        console.error(err.stack);
    }
});

console.log('--- Import Test Complete ---');
