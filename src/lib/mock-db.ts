// Temporary in-memory user storage for testing
// This will be reset when the server restarts

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mock user data
let users: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'customer',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    name: 'Jane Smith', 
    email: 'jane.smith@example.com',
    role: 'customer',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-20')
  },
  {
    id: '3',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '4',
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    role: 'customer',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '5',
    name: 'Alice Brown',
    email: 'alice.brown@example.com',
    role: 'customer',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Mock orders data for order counts
const mockOrders = [
  { id: '1', customerEmail: 'john.doe@example.com' },
  { id: '2', customerEmail: 'john.doe@example.com' },
  { id: '3', customerEmail: 'jane.smith@example.com' },
  { id: '4', customerEmail: 'bob.johnson@example.com' },
  { id: '5', customerEmail: 'alice.brown@example.com' },
  { id: '6', customerEmail: 'alice.brown@example.com' },
  { id: '7', customerEmail: 'alice.brown@example.com' },
];

export const mockDb = {
  getUsers: () => users,
  
  getUsersExcludingRole: (excludeRole: string) => 
    users.filter(user => user.role !== excludeRole),
    
  getUserById: (id: string) => 
    users.find(user => user.id === id),
    
  getUserByEmail: (email: string) => 
    users.find(user => user.email === email),
    
  getOrderCountByEmail: (email: string) => 
    mockOrders.filter(order => order.customerEmail === email).length,
    
  updateUser: (id: string, updates: Partial<User>) => {
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updates, updatedAt: new Date() };
      return users[userIndex];
    }
    return null;
  },
  
  addUser: (user: Omit<User, 'createdAt' | 'updatedAt'>) => {
    const newUser = {
      ...user,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    users.push(newUser);
    return newUser;
  }
};
