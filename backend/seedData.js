const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

// Force Google DNS for this process to bypass local ISP blocks on MongoDB SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);
const Course = require('./models/Course');
const User = require('./models/User');
const connectDB = require('./config/database');

dotenv.config();

const sampleCourses = [
  {
    title: 'Complete Web Development Bootcamp',
    description: 'Learn HTML, CSS, JavaScript, React, Node.js and MongoDB from scratch. Build real-world projects and become a full-stack developer.',
    category: 'Programming',
    level: 'Beginner',
    isPaid: true,
    price: 2999,
    thumbnail: 'https://source.unsplash.com/400x250/?programming,code',
    status: 'published',
    modules: [
      {
        title: 'Introduction to Web Development',
        description: 'Get started with the basics',
        order: 1,
        lessons: [
          {
            title: 'What is Web Development?',
            description: 'Overview of web development',
            type: 'video',
            duration: 15,
            order: 1,
            content: 'Welcome to the course! In this lesson, we will cover the fundamentals of web development...',
            contentType: 'video',
            contentUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
          },
          {
            title: 'Setting Up Your Environment',
            description: 'Install necessary tools',
            type: 'video',
            duration: 20,
            order: 2,
            content: 'Let\'s set up your development environment...',
            contentType: 'video',
            contentUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
          }
        ]
      },
      {
        title: 'HTML & CSS Fundamentals',
        description: 'Learn the building blocks of web pages',
        order: 2,
        lessons: [
          {
            title: 'HTML Basics',
            description: 'Introduction to HTML',
            type: 'text',
            duration: 25,
            order: 1,
            content: 'HTML is the foundation of all web pages. In this lesson, you will learn about HTML elements, tags, and structure.',
            contentType: 'text',
            contentUrl: 'https://example.com/html-basics'
          }
        ]
      }
    ]
  },
  {
    title: 'Python for Data Science',
    description: 'Master Python programming and data analysis with pandas, numpy, and matplotlib. Perfect for beginners!',
    category: 'Data Science',
    level: 'Beginner',
    isPaid: true,
    price: 3499,
    thumbnail: 'https://source.unsplash.com/400x250/?python,data',
    status: 'published',
    modules: [
      {
        title: 'Python Basics',
        description: 'Learn Python fundamentals',
        order: 1,
        lessons: [
          {
            title: 'Python Introduction',
            description: 'Getting started with Python',
            type: 'video',
            duration: 20,
            order: 1,
            content: 'Python is a powerful programming language...',
            contentType: 'video',
            contentUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
          },
          {
            title: 'Variables and Data Types',
            description: 'Understanding Python data types',
            type: 'video',
            duration: 30,
            order: 2,
            content: 'Python has several built-in data types...',
            contentType: 'video',
            contentUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
          }
        ]
      }
    ]
  },
  {
    title: 'UI/UX Design Masterclass',
    description: 'Learn to design beautiful user interfaces and create amazing user experiences with Figma.',
    category: 'Design',
    level: 'Intermediate',
    isPaid: true,
    price: 2499,
    thumbnail: 'https://source.unsplash.com/400x250/?design,ui',
    status: 'published',
    modules: [
      {
        title: 'Design Fundamentals',
        description: 'Core design principles',
        order: 1,
        lessons: [
          {
            title: 'Introduction to UI/UX',
            description: 'What is UI/UX Design?',
            type: 'video',
            duration: 18,
            order: 1,
            content: 'UI/UX design is crucial for creating great products...',
            contentType: 'video',
            contentUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
          }
        ]
      }
    ]
  },
  {
    title: 'Digital Marketing Complete Course',
    description: 'Learn SEO, social media marketing, email marketing, and analytics. Become a digital marketing expert!',
    category: 'Marketing',
    level: 'Beginner',
    isPaid: false,
    price: 0,
    thumbnail: 'https://source.unsplash.com/400x250/?marketing,digital',
    status: 'published',
    modules: [
      {
        title: 'Marketing Basics',
        description: 'Introduction to digital marketing',
        order: 1,
        lessons: [
          {
            title: 'What is Digital Marketing?',
            description: 'Overview of digital marketing',
            type: 'video',
            duration: 12,
            order: 1,
            content: 'Digital marketing encompasses all marketing efforts...',
            contentType: 'video',
            contentUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
          }
        ]
      }
    ]
  },
  {
    title: 'Business Strategy and Management',
    description: 'Learn essential business strategies, leadership skills, and management techniques for success.',
    category: 'Business',
    level: 'Intermediate',
    isPaid: true,
    price: 1999,
    thumbnail: 'https://source.unsplash.com/400x250/?business,strategy',
    status: 'published',
    modules: [
      {
        title: 'Business Fundamentals',
        description: 'Core business concepts',
        order: 1,
        lessons: [
          {
            title: 'Introduction to Business',
            description: 'Business basics',
            type: 'video',
            duration: 25,
            order: 1,
            content: 'Understanding business fundamentals is key...',
            contentType: 'video',
            contentUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
          }
        ]
      }
    ]
  },
  {
    title: 'JavaScript ES6+ Complete Guide',
    description: 'Master modern JavaScript including ES6+, async/await, modules, and more. Build real projects!',
    category: 'Programming',
    level: 'Intermediate',
    isPaid: false,
    price: 0,
    thumbnail: 'https://source.unsplash.com/400x250/?javascript,coding',
    status: 'published',
    modules: [
      {
        title: 'Modern JavaScript',
        description: 'ES6+ features',
        order: 1,
        lessons: [
          {
            title: 'ES6 Introduction',
            description: 'What is ES6?',
            type: 'video',
            duration: 22,
            order: 1,
            content: 'ES6 introduced many powerful features to JavaScript...',
            contentType: 'video',
            contentUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
          }
        ]
      }
    ]
  },
  {
    title: 'React - The Complete Guide',
    description: 'Master React.js from basics to advanced. Build modern web applications with hooks, context, and more!',
    category: 'Programming',
    level: 'Intermediate',
    isPaid: true,
    price: 3999,
    thumbnail: 'https://source.unsplash.com/400x250/?react,javascript',
    status: 'published',
    modules: [
      {
        title: 'React Fundamentals',
        description: 'Core React concepts',
        order: 1,
        lessons: [
          {
            title: 'What is React?',
            description: 'Introduction to React',
            type: 'video',
            duration: 18,
            order: 1,
            content: 'React is a JavaScript library for building user interfaces...',
            contentType: 'video',
            contentUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
          }
        ]
      }
    ]
  },
  {
    title: 'Graphic Design for Beginners',
    description: 'Learn Adobe Photoshop, Illustrator, and design principles. Create stunning graphics from scratch!',
    category: 'Design',
    level: 'Beginner',
    isPaid: true,
    price: 1999,
    thumbnail: 'https://source.unsplash.com/400x250/?graphic,design',
    status: 'published',
    modules: [
      {
        title: 'Design Basics',
        description: 'Introduction to graphic design',
        order: 1,
        lessons: [
          {
            title: 'Design Principles',
            description: 'Core design concepts',
            type: 'video',
            duration: 16,
            order: 1,
            content: 'Understanding design principles is essential...',
            contentType: 'video',
            contentUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
          }
        ]
      }
    ]
  }
];

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('🗑️  Clearing existing courses...');
    await Course.deleteMany({});

    console.log('👤 Creating demo accounts...');

    // Create Teacher
    let teacher = await User.findOne({ email: 'teacher@test.com' });
    if (!teacher) {
      teacher = await User.create({
        name: 'Demo Teacher',
        email: 'teacher@test.com',
        password: 'password123',
        role: 'teacher'
      });
      console.log('   ✓ Teacher: teacher@test.com / password123');
    }

    // Create Student
    let student = await User.findOne({ email: 'student@test.com' });
    if (!student) {
      student = await User.create({
        name: 'Demo Student',
        email: 'student@test.com',
        password: 'password123',
        role: 'student'
      });
      console.log('   ✓ Student: student@test.com / password123');
    }

    // Create Admin
    let admin = await User.findOne({ email: 'superadmin@eduvillage.com' });
    if (!admin) {
      admin = await User.create({
        name: 'Super Admin',
        email: 'superadmin@eduvillage.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('   ✓ Admin:   superadmin@eduvillage.com / admin123');
    }

    console.log('📚 Adding sample courses...');

    for (let courseData of sampleCourses) {
      courseData.instructor = teacher._id;
      const course = await Course.create(courseData);
      console.log(`   ✓ Created: ${course.title}`);
    }

    console.log('\n✅ SUCCESS! Database seeded with demo accounts!');
    console.log('🎓 You can now use the demo buttons in the Login page.');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding database:', error.message);
    console.error('\nFull error details:', error);
    process.exit(1);
  }
};

seedDatabase();