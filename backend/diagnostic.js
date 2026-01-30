try {
    console.log('Testing Assignmentcontroller...');
    const ac = require('./controllers/Assignmentcontroller');
    console.log('Assignmentcontroller loaded successfully. Exports:', Object.keys(ac));

    console.log('Testing Assignmentroutes...');
    const ar = require('./routes/Assignmentroutes');
    console.log('Assignmentroutes loaded successfully.');

    console.log('Testing courseController...');
    const cc = require('./controllers/courseController');
    console.log('courseController loaded successfully. Exports:', Object.keys(cc));

    console.log('Testing Teachercontroller...');
    const tc = require('./controllers/Teachercontroller');
    console.log('Teachercontroller loaded successfully. Exports:', Object.keys(tc));

    console.log('Testing TeacherRoutes...');
    const tr = require('./routes/TeacherRoutes');
    console.log('TeacherRoutes loaded successfully.');

    console.log('All checks passed!');
} catch (error) {
    console.error('DIAGNOSTIC FAILED:');
    console.error(error);
    process.exit(1);
}
