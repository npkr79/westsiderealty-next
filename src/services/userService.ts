
// Define a minimal User type for local storage operations
type User = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  profileCompleted?: boolean;
  [key: string]: any;
};

export const userService = {
  saveUserToStorage(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    console.log('UserService: User saved to localStorage');
  },

  loadUserFromStorage(): User | null {
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        console.log('UserService: Loaded user from localStorage:', userData);
        return userData;
      }
      return null;
    } catch (error) {
      console.error('UserService: Error parsing stored user:', error);
      localStorage.removeItem('currentUser');
      return null;
    }
  },

  clearUserFromStorage(): void {
    localStorage.removeItem('currentUser');
    console.log('UserService: User cleared from localStorage');
  },

  updateUserProfile(user: User, profileData: any): User {
    const updatedUser: User = {
      ...user,
      ...profileData,
      profileCompleted: true
    };

    this.saveUserToStorage(updatedUser);
    console.log('UserService: Profile updated successfully');
    return updatedUser;
  },

  getCurrentUser(): User | null {
    return this.loadUserFromStorage();
  },

  getUserById(id: string): User | null {
    const currentUser = this.getCurrentUser();
    return currentUser?.id === id ? currentUser : null;
  },

  init(): void {
    console.log('UserService: Initialized');
  }
};
