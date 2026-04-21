import * as authService from '../services/auth.services';
import { Request, Response } from 'express';

const getErrorMessage = (error: unknown, fallbackMessage: string) => {
    if (error instanceof Error) {
        return error.message;
    }
    return fallbackMessage;
};

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const user = await authService.register({ name, email, password });
        res.status(201).json({msg: "User registered successfully", user });
    } catch (error: unknown) {
    res.status(400).json({ message: getErrorMessage(error, "Error registering user") });
    }
}

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const token = await authService.login({ email, password });
        res.status(200).json({ msg: "Login successful", token });
    } catch (error: unknown) {
    res.status(400).json({ message: getErrorMessage(error, "Error login") });
    }
}

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await authService.getAllUsers();
        res.status(200).json(users);
    } catch (error: unknown) {
        res.status(400).json({ message: getErrorMessage(error, "Error fetching users") });
    }
}

export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await authService.getUserById(String(id));
        res.status(200).json(user);
    } catch (error: unknown) {
        res.status(400).json({ message: getErrorMessage(error, "Error fetching user") });
    }
}

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email, password, role } = req.body;

        if (name === undefined && email === undefined && password === undefined && role === undefined) {
            return res.status(400).json({ message: "At least one field is required" });
        }

        const user = await authService.updateUser(String(id), { name, email, password, role });
        res.status(200).json({ msg: "User updated successfully", user });
    } catch (error: unknown) {
        res.status(400).json({ message: getErrorMessage(error, "Error updating user") });
    }
}

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await authService.deleteUser(String(id));
        res.status(200).json({ msg: "User deleted successfully" });
    } catch (error: unknown) {
        res.status(400).json({ message: getErrorMessage(error, "Error deleting user") });
    }
}   
