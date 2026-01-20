const Course = require('../models/Course');
const User = require('../models/User');
const Progress = require('../models/Progress');

exports.getAllCourses = async (req, res, next) => {
  try {
    const { category, level, status, search } = req.query;
<<<<<<< HEAD

    let query = {};

    if (category) query.category = category;
    if (level) query.level = level;

=======
    
    let query = {};
    
    if (category) query.category = category;
    if (level) query.level = level;
    
>>>>>>> 2066d84652fabaaa540b5607d7cc3bf04bd6afbc
    if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
      if (status) query.status = status;
    } else {
      query.status = 'published';
    }
<<<<<<< HEAD

=======
    
>>>>>>> 2066d84652fabaaa540b5607d7cc3bf04bd6afbc
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const courses = await Course.find(query)
      .populate('instructor', 'name profilePicture')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

exports.getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email profilePicture bio');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
};

exports.createCourse = async (req, res, next) => {
  try {
    req.body.instructor = req.user.id;

    const course = await Course.create(req.body);

    await User.findByIdAndUpdate(req.user.id, {
      $push: { createdCourses: course._id }
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCourse = async (req, res, next) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this course'
      });
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this course'
      });
    }

<<<<<<< HEAD
    // Remove course from instructor's createdCourses
    await User.findByIdAndUpdate(course.instructor, {
      $pull: { createdCourses: course._id }
    });

    // Remove course from all enrolled students' enrolledCourses
    await User.updateMany(
      { enrolledCourses: course._id },
      { $pull: { enrolledCourses: course._id } }
    );

    // Remove all progress records for this course
    await Progress.deleteMany({ course: course._id });

=======
>>>>>>> 2066d84652fabaaa540b5607d7cc3bf04bd6afbc
    await course.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.enrollCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (course.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'This course is not available for enrollment'
      });
    }

<<<<<<< HEAD
    if (course.enrolledStudents.some(id => id.toString() === req.user.id)) {
=======
    if (course.enrolledStudents.includes(req.user.id)) {
>>>>>>> 2066d84652fabaaa540b5607d7cc3bf04bd6afbc
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    course.enrolledStudents.push(req.user.id);
    await course.save();

    await User.findByIdAndUpdate(req.user.id, {
      $push: { enrolledCourses: course._id }
    });

    await Progress.create({
      student: req.user.id,
      course: course._id
    });

    res.status(200).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: course
    });
  } catch (error) {
    next(error);
  }
};

exports.getTeacherCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ instructor: req.user.id })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

exports.getEnrolledCourses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'enrolledCourses',
      populate: { path: 'instructor', select: 'name profilePicture' }
    });

    const coursesWithProgress = await Promise.all(
<<<<<<< HEAD
      user.enrolledCourses
        .filter(course => course !== null) // Handle cases where a course might have been deleted
        .map(async (course) => {
          const progress = await Progress.findOne({
            student: req.user.id,
            course: course._id
          });

          return {
            ...course.toObject(),
            progress: progress ? progress.progressPercentage : 0
          };
        })
=======
      user.enrolledCourses.map(async (course) => {
        const progress = await Progress.findOne({
          student: req.user.id,
          course: course._id
        });

        return {
          ...course.toObject(),
          progress: progress ? progress.progressPercentage : 0
        };
      })
>>>>>>> 2066d84652fabaaa540b5607d7cc3bf04bd6afbc
    );

    res.status(200).json({
      success: true,
      count: coursesWithProgress.length,
      data: coursesWithProgress
    });
  } catch (error) {
    next(error);
  }
};