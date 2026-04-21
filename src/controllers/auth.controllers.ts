import * as authService from '../services/auth.services';
import { Request, Response } from 'express';

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const user = await authService.register({ name, email, password });
        res.status(201).json({msg: "User registered successfully", token: user });
    } catch (error) {
        res.status(400).json({ message: "Error registering user" });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const token = await authService.login({ email, password });
        res.status(200).json({ msg: "Login successful", token });
    } catch (error) {
        res.status(400).json({ message: "Error logging in" });
    }
}

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await authService.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(400).json({ message: "Error fetching users" });
    }
}

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await authService.deleteUser(String(id));
        res.status(200).json({ msg: "User deleted successfully" });
    } catch (error) {
        res.status(400).json({ message: "Error deleting user" });
    }
}   
