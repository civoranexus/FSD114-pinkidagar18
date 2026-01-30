try {
    console.log('Testing TeacherRoutes requires...');
    const { getTeacherAssignments } = require('./controllers/Assignmentcontroller');
    console.log('getTeacherAssignments imported:', typeof getTeacherAssignments);

    const tr = require('./routes/TeacherRoutes');
    console.log('TeacherRoutes loaded.');
} catch (e) {
    console.error(e);
}
