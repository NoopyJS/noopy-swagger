export interface User {
    id: number;
    name: string;
    email: string;
}

let users: User[] = [];
let idCounter = 1;

export const createUser = (name: string, email: string): User => {
    const newUser = { id: idCounter++, name, email };
    users.push(newUser);
    return newUser;
};

export const getUsers = (): User[] => {
    return users;
};

export const getUserById = (id: number): User | undefined => {
    return users.find(user => user.id === id);
};

export const updateUser = (id: number, name: string, email: string): User | null => {
    const user = getUserById(id);
    if (user) {
        user.name = name;
        user.email = email;
        return user;
    }
    return null;
};

export const deleteUser = (id: number): boolean => {
    const index = users.findIndex(user => user.id === id);
    if (index !== -1) {
        users.splice(index, 1);
        return true;
    }
    return false;
};
