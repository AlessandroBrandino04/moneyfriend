import { UserRepository } from '../repositories/user.repository';
import bcrypt from 'bcryptjs';
import { generateToken, verifyToken } from '../security/jwtTokenProvider'; 
import { toPublic, User, UserPublic, CreateUserDTO, UpdateUserDTO } from '../models/User';


/**
 * Il Service Layer gestisce la logica di business, l'hashing delle password, 
 * e l'interazione con il Repository e i Provider di sicurezza (JWT).
 */
export class UsersService {
  private repo: UserRepository;

  constructor(repo?: UserRepository) {
    this.repo = repo ?? new UserRepository();
  }

  // --- Funzioni Helper di Sicurezza ---

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // --- Logica di Business ---

  async register(payload: CreateUserDTO): Promise<{ user: UserPublic; token: string }> {
    
    //stampa per debug
    console.log('Minchia fra:', payload);

    if (!payload.password) throw new Error('Password is required');

    // 1. Controlla l'esistenza dell'utente
    const existing = await this.repo.findByEmail(payload.email);
    if (existing) throw new Error('Email already in use');

    // 2. Hash della password
    const passwordHash = await this.hashPassword(payload.password);

    // 3. Creazione dell'utente nel DB
    const user = await this.repo.createUser({
      email: payload.email,
      name: payload.name,
      surname: payload.surname,
      passwordHash: passwordHash,
    });

    // 4. Mappiamo e generiamo il token
    const publicUser: UserPublic = toPublic(user as any);
    const token = generateToken(user as any);

    return { user: publicUser, token };
  }

  async login(email: string, password: string): Promise<{ user: UserPublic; token: string } | null> {
    
    // 1. Trova l'utente (recuperando l'hash)
    const user = await this.repo.findByEmail(email) as User;
    
    if (!user) return null;
    
    // 2. Verifica la password
    // La hash si trova nel campo 'password' dell'oggetto User
    const ok = await this.comparePassword(password, user.passwordHash); 
    if (!ok) return null;
    
    // 3. Genera JWT
    const publicUser: UserPublic = toPublic(user);
    const token = generateToken(user); 
    
    return { user: publicUser, token };
  }

  /**
   * Get user public view. If requesterId is the same as id, return full public info.
   * If requesterId is provided and is an accepted friend, return full public info.
   * Otherwise return null (or limited info) — here we choose to return null for privacy.
   */
  async getUser(id: string, requesterId?: string): Promise<UserPublic | null> {
    const user = await this.repo.findById(id) as User;
    if (!user) return null;

    // If requester is the same user, return public
    if (requesterId && requesterId === id) return toPublic(user);

    // If no requester provided, hide private info
    if (!requesterId) return null;

    // Check friendship status via FriendshipRepository (lazy load)
    try {
      const { FriendshipRepository } = await import('../repositories/friendship.repository');
      const frRepo = new FriendshipRepository();
      const friendship = await frRepo.findBetween(requesterId, id);
      if (friendship && (friendship.status === 'ACCEPTED' || (friendship as any).status === 'ACCEPTED')) {
        return toPublic(user);
      }
    } catch (e) {
      // If friendship repo not available or error, be conservative
      console.debug('Friendship check failed:', e);
    }

    // Not friend — do not expose private fields
    return null;
  }

  async updateUser(id: string, data: UpdateUserDTO): Promise<UserPublic> {
    const user = await this.repo.updateUser(id, data) as User; 
    return toPublic(user);
  }

  async deleteUser(id: string): Promise<{ success: true }> {
    await this.repo.deleteUser(id);
    return { success: true };
  }
}