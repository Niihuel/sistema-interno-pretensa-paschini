import { Injectable, NotFoundException, Logger, InternalServerErrorException, Inject, forwardRef, Optional } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { CreateBackupLogDto, UpdateBackupLogDto, QueryBackupLogDto } from './dto';
import { BackupLog } from './entities/backup-log.entity';
import { Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';
import { NotificationsService } from '@/notifications/notifications.service';

const execAsync = promisify(exec);

@Injectable()
export class BackupsService {
  private readonly logger = new Logger(BackupsService.name);
  private readonly backupDir: string;
  private readonly pgBinPath: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @Optional()
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {
    // Carpeta para guardar backups (ubicación fácil de acceder)
    this.backupDir = 'C:\\BackupsSistemaIT';
    // Ruta de binarios de PostgreSQL 18
    this.pgBinPath = 'C:\\Program Files\\PostgreSQL\\18\\bin';
    this.ensureBackupDirectory();
  }

  private async ensureBackupDirectory() {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
      this.logger.log(`Created backup directory at ${this.backupDir}`);
    }
  }

  private parseConnectionString(databaseUrl: string) {
    // postgresql://user:password@host:port/database
    const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    const match = databaseUrl.match(regex);

    if (!match) {
      throw new Error('Invalid DATABASE_URL format');
    }

    return {
      user: match[1],
      password: match[2],
      host: match[3],
      port: match[4],
      database: match[5],
    };
  }

  async create(dto: CreateBackupLogDto): Promise<BackupLog> {
    return this.prisma.backupLog.create({
      data: {
        backupName: dto.backupName,
        backupType: dto.backupType,
        source: dto.source,
        destination: dto.destination,
        status: dto.status,
        startTime: dto.startTime ? new Date(dto.startTime) : null,
        endTime: dto.endTime ? new Date(dto.endTime) : null,
        duration: dto.duration || null,
        sizeBytes: dto.sizeBytes || null,
        errorMessage: dto.errorMessage || null,
        notes: dto.notes || null,
      },
    });
  }

  async findAll(query: QueryBackupLogDto): Promise<{
    items: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { search, status, backupType, startDate, endDate, page = 1, limit = 50 } = query;

    const where: Prisma.BackupLogWhereInput = {};

    if (search) {
      where.OR = [
        { backupName: { contains: search, mode: 'insensitive' } },
        { source: { contains: search, mode: 'insensitive' } },
        { destination: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;
    if (backupType) where.backupType = backupType;

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    const [items, total] = await Promise.all([
      this.prisma.backupLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startTime: 'desc' },
      }),
      this.prisma.backupLog.count({ where }),
    ]);

    // Convert BigInt to Number for JSON serialization
    const serializedItems = items.map(item => ({
      ...item,
      sizeBytes: item.sizeBytes ? Number(item.sizeBytes) : 0,
    }));

    return { items: serializedItems, total, page, limit };
  }

  async findOne(id: number): Promise<any> {
    const backupLog = await this.prisma.backupLog.findUnique({
      where: { id },
    });

    if (!backupLog) {
      throw new NotFoundException(`Backup log with ID ${id} not found`);
    }

    // Convert BigInt to Number for JSON serialization
    return {
      ...backupLog,
      sizeBytes: backupLog.sizeBytes ? Number(backupLog.sizeBytes) : BigInt(0),
    } as BackupLog;
  }

  async update(id: number, dto: UpdateBackupLogDto): Promise<any> {
    await this.findOne(id);

    const updated = await this.prisma.backupLog.update({
      where: { id },
      data: {
        ...dto,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
      },
    });

    // Convert BigInt to Number for JSON serialization
    return {
      ...updated,
      sizeBytes: updated.sizeBytes ? Number(updated.sizeBytes) : BigInt(0),
    } as BackupLog;
  }

  async remove(id: number): Promise<void> {
    const backup = await this.findOne(id);

    // Eliminar el archivo físico si existe
    if (backup.backupName) {
      const filePath = path.join(this.backupDir, backup.backupName);
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
        this.logger.log(`Deleted backup file: ${filePath}`);
      } catch (error) {
        this.logger.warn(`Backup file not found or could not be deleted: ${filePath}`);
      }
    }

    // Eliminar el registro de la base de datos
    await this.prisma.backupLog.delete({ where: { id } });
  }

  // Métodos adicionales específicos de backups
  async getRecentBackups(limit: number = 10): Promise<any[]> {
    const backups = await this.prisma.backupLog.findMany({
      take: limit,
      orderBy: { startTime: 'desc' },
    });

    // Convert BigInt to Number for JSON serialization
    return backups.map(backup => ({
      ...backup,
      sizeBytes: backup.sizeBytes ? Number(backup.sizeBytes) : BigInt(0),
    })) as BackupLog[];
  }

  async getBackupStats(): Promise<{
    total: number;
    successful: number;
    failed: number;
    inProgress: number;
    totalSizeBytes: number;
  }> {
    const [total, successful, failed, inProgress, sizeAgg] = await Promise.all([
      this.prisma.backupLog.count(),
      this.prisma.backupLog.count({ where: { status: 'SUCCESS' } }),
      this.prisma.backupLog.count({ where: { status: 'FAILED' } }),
      this.prisma.backupLog.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.backupLog.aggregate({
        _sum: { sizeBytes: true },
      }),
    ]);

    return {
      total,
      successful,
      failed,
      inProgress,
      totalSizeBytes: Number(sizeAgg._sum.sizeBytes || 0),
    };
  }

  /**
   * Crea un backup manual de la base de datos
   */
  async createDatabaseBackup(backupType: 'FULL' | 'MANUAL' = 'MANUAL'): Promise<any> {
    const startTime = new Date();
    const timestamp = startTime.toISOString().replace(/[:.]/g, '-').split('T').join('_').substring(0, 19);
    const fileName = `backup_${timestamp}.sql`;
    const filePath = path.join(this.backupDir, fileName);

    // Crear registro inicial
    let backupLog = await this.prisma.backupLog.create({
      data: {
        backupName: fileName,
        backupType: backupType,
        source: this.configService.get('DATABASE_URL', '').split('@')[1] || 'database',
        destination: filePath,
        status: 'IN_PROGRESS',
        startTime,
        sizeBytes: BigInt(0),
      },
    });

    try {
      const databaseUrl = this.configService.get('DATABASE_URL');
      if (!databaseUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      const dbConfig = this.parseConnectionString(databaseUrl);

      // Ejecutar pg_dump directamente (PostgreSQL local en puerto 5434)
      const pgDumpPath = path.join(this.pgBinPath, 'pg_dump.exe');
      const command = `"${pgDumpPath}" -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -F c -b -v -f "${filePath}"`;

      this.logger.log(`Starting backup: ${fileName}`);

      // Ejecutar el comando con la contraseña en variable de entorno
      await execAsync(command, {
        env: { ...process.env, PGPASSWORD: dbConfig.password },
        maxBuffer: 1024 * 1024 * 100 // 100MB buffer
      });

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      // Obtener tamaño del archivo
      const stats = await fs.stat(filePath);
      const sizeBytes = BigInt(stats.size);

      // Actualizar registro con éxito
      backupLog = await this.prisma.backupLog.update({
        where: { id: backupLog.id },
        data: {
          status: 'SUCCESS',
          endTime,
          duration,
          sizeBytes,
        },
      });

      this.logger.log(`Backup completed successfully: ${fileName} (${stats.size} bytes)`);

      // Enviar notificación de éxito
      try {
        if (this.notificationsService) {
          await this.notificationsService.notifyBackupComplete(backupType, 'SUCCESS', fileName);
        }
      } catch (error) {
        this.logger.warn('Failed to send backup notification', error);
      }

      // Convert BigInt to Number for JSON serialization
      return {
        ...backupLog,
        sizeBytes: backupLog.sizeBytes ? Number(backupLog.sizeBytes) : BigInt(0),
      } as BackupLog;
    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      // Actualizar registro con error
      backupLog = await this.prisma.backupLog.update({
        where: { id: backupLog.id },
        data: {
          status: 'FAILED',
          endTime,
          duration,
          errorMessage: error.message || 'Unknown error',
        },
      });

      this.logger.error(`Backup failed: ${error.message}`, error.stack);

      // Enviar notificación de fallo
      try {
        if (this.notificationsService) {
          await this.notificationsService.notifyBackupComplete(backupType, 'FAILED');
        }
      } catch (notifError) {
        this.logger.warn('Failed to send backup failure notification', notifError);
      }

      throw new InternalServerErrorException(`Failed to create backup: ${error.message}`);
    }
  }

  /**
   * Restaura la base de datos desde un backup
   */
  async restoreDatabaseBackup(backupId: number): Promise<void> {
    const backupLog = await this.findOne(backupId);

    if (backupLog.status !== 'SUCCESS') {
      throw new Error('Can only restore from successful backups');
    }

    const filePath = backupLog.destination;
    const restoreStatusFile = path.join(this.backupDir, '.restoring');

    try {
      // Verificar que el archivo existe
      await fs.access(filePath);

      const databaseUrl = this.configService.get('DATABASE_URL');
      if (!databaseUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      const dbConfig = this.parseConnectionString(databaseUrl);

      this.logger.log(`Starting restore from backup: ${backupLog.backupName}`);

      // Create restore status file to indicate restoration is in progress
      await fs.writeFile(restoreStatusFile, JSON.stringify({
        startedAt: new Date().toISOString(),
        backupId,
        backupName: backupLog.backupName,
        status: 'RESTORING',
        message: 'Restaurando base de datos. Este proceso puede tardar varios minutos...'
      }));

      // ADVERTENCIA: Este proceso eliminará todos los datos actuales
      // Rutas completas de los ejecutables de PostgreSQL
      const psqlPath = path.join(this.pgBinPath, 'psql.exe');
      const pgRestorePath = path.join(this.pgBinPath, 'pg_restore.exe');

      // Primero desconectar todas las conexiones activas (PostgreSQL local)
      const disconnectCommand = `"${psqlPath}" -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbConfig.database}' AND pid <> pg_backend_pid();"`;

      // Eliminar la base de datos
      const dropCommand = `"${psqlPath}" -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d postgres -c "DROP DATABASE IF EXISTS \\"${dbConfig.database}\\";"`;

      // Crear la base de datos nuevamente
      const createCommand = `"${psqlPath}" -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d postgres -c "CREATE DATABASE \\"${dbConfig.database}\\";"`;

      // Ejecutar comandos secuencialmente con PGPASSWORD
      const execOptions = { env: { ...process.env, PGPASSWORD: dbConfig.password } };

      await execAsync(disconnectCommand, execOptions);
      this.logger.log('Disconnected active connections');

      await execAsync(dropCommand, execOptions);
      this.logger.log('Dropped existing database');

      await execAsync(createCommand, execOptions);
      this.logger.log('Created new database');

      // Restaurar el backup directamente
      const restoreCommand = `"${pgRestorePath}" -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -v "${filePath}"`;

      await execAsync(restoreCommand, execOptions);

      this.logger.log('Restored backup successfully');

      this.logger.log(`Restore completed successfully from: ${backupLog.backupName}`);

      // Remove restore status file
      try {
        await fs.unlink(restoreStatusFile);
      } catch (unlinkError) {
        this.logger.warn('Failed to delete restore status file', unlinkError);
      }
    } catch (error) {
      this.logger.error(`Restore failed: ${error.message}`, error.stack);

      // Remove restore status file even on error
      try {
        await fs.unlink(restoreStatusFile);
      } catch (unlinkError) {
        this.logger.warn('Failed to delete restore status file after error', unlinkError);
      }

      throw new InternalServerErrorException(`Failed to restore backup: ${error.message}`);
    }
  }

  /**
   * Check if a database restore is currently in progress
   */
  async isRestoring(): Promise<{ restoring: boolean; details?: any }> {
    const restoreStatusFile = path.join(this.backupDir, '.restoring');

    try {
      await fs.access(restoreStatusFile);
      const statusData = await fs.readFile(restoreStatusFile, 'utf-8');
      return {
        restoring: true,
        details: JSON.parse(statusData)
      };
    } catch (error) {
      return { restoring: false };
    }
  }

  /**
   * Restaura la base de datos desde un archivo subido por el usuario
   */
  async restoreFromUploadedFile(fileBuffer: Buffer, originalName: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').substring(0, 19);
    const fileName = `uploaded_${timestamp}_${originalName}`;
    const filePath = path.join(this.backupDir, fileName);
    const restoreStatusFile = path.join(this.backupDir, '.restoring');

    try {
      // Guardar el archivo subido temporalmente
      await fs.writeFile(filePath, fileBuffer);
      this.logger.log(`Uploaded backup file saved: ${fileName}`);

      const databaseUrl = this.configService.get('DATABASE_URL');
      if (!databaseUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      const dbConfig = this.parseConnectionString(databaseUrl);

      this.logger.log(`Starting restore from uploaded file: ${fileName}`);

      // Create restore status file
      await fs.writeFile(restoreStatusFile, JSON.stringify({
        startedAt: new Date().toISOString(),
        fileName,
        status: 'RESTORING',
        message: 'Restaurando base de datos desde archivo subido. Este proceso puede tardar varios minutos...'
      }));

      // Rutas completas de los ejecutables de PostgreSQL
      const psqlPath = path.join(this.pgBinPath, 'psql.exe');
      const pgRestorePath = path.join(this.pgBinPath, 'pg_restore.exe');

      // Desconectar conexiones activas
      const disconnectCommand = `"${psqlPath}" -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbConfig.database}' AND pid <> pg_backend_pid();"`;

      // Eliminar la base de datos
      const dropCommand = `"${psqlPath}" -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d postgres -c "DROP DATABASE IF EXISTS \\"${dbConfig.database}\\";"`;

      // Crear la base de datos nuevamente
      const createCommand = `"${psqlPath}" -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d postgres -c "CREATE DATABASE \\"${dbConfig.database}\\";"`;

      // Ejecutar comandos secuencialmente con PGPASSWORD
      const execOptions = { env: { ...process.env, PGPASSWORD: dbConfig.password } };

      await execAsync(disconnectCommand, execOptions);
      this.logger.log('Disconnected active connections');

      await execAsync(dropCommand, execOptions);
      this.logger.log('Dropped existing database');

      await execAsync(createCommand, execOptions);
      this.logger.log('Created new database');

      // Restaurar el backup
      const restoreCommand = `"${pgRestorePath}" -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -v "${filePath}"`;

      await execAsync(restoreCommand, execOptions);

      this.logger.log('Restored backup successfully from uploaded file');

      // Crear registro del backup restaurado
      await this.prisma.backupLog.create({
        data: {
          backupName: fileName,
          backupType: 'MANUAL',
          source: 'Archivo subido por usuario',
          destination: filePath,
          status: 'SUCCESS',
          startTime: new Date(),
          endTime: new Date(),
          sizeBytes: BigInt(fileBuffer.length),
          notes: `Restaurado desde archivo subido: ${originalName}`,
        },
      });

      // Remove restore status file
      try {
        await fs.unlink(restoreStatusFile);
      } catch (unlinkError) {
        this.logger.warn('Failed to delete restore status file', unlinkError);
      }

      this.logger.log(`Restore completed successfully from uploaded file: ${fileName}`);
    } catch (error) {
      this.logger.error(`Restore from uploaded file failed: ${error.message}`, error.stack);

      // Remove temporary file
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        this.logger.warn('Failed to delete temporary backup file', unlinkError);
      }

      // Remove restore status file
      try {
        await fs.unlink(restoreStatusFile);
      } catch (unlinkError) {
        this.logger.warn('Failed to delete restore status file after error', unlinkError);
      }

      throw new InternalServerErrorException(`Failed to restore from uploaded file: ${error.message}`);
    }
  }

  /**
   * Cron job para backups automáticos semanales
   * Se ejecuta todos los domingos a las 2:00 AM
   */
  @Cron('0 2 * * 0') // 0 2 * * 0 = 2:00 AM todos los domingos
  async handleWeeklyBackup() {
    this.logger.log('Starting scheduled weekly backup');
    try {
      await this.createDatabaseBackup('FULL');
      this.logger.log('Scheduled weekly backup completed successfully');
    } catch (error) {
      this.logger.error('Scheduled weekly backup failed', error.stack);
    }
  }

  /**
   * Elimina backups antiguos (opcional - mantener solo los últimos N backups)
   */
  async cleanupOldBackups(keepCount: number = 10): Promise<void> {
    const allBackups = await this.prisma.backupLog.findMany({
      where: { status: 'SUCCESS' },
      orderBy: { startTime: 'desc' },
    });

    if (allBackups.length <= keepCount) {
      return; // No hay nada que limpiar
    }

    const backupsToDelete = allBackups.slice(keepCount);

    for (const backup of backupsToDelete) {
      try {
        // Eliminar archivo físico
        await fs.unlink(backup.destination);
        // Eliminar registro
        await this.prisma.backupLog.delete({ where: { id: backup.id } });
        this.logger.log(`Deleted old backup: ${backup.backupName}`);
      } catch (error) {
        this.logger.warn(`Failed to delete backup ${backup.backupName}: ${error.message}`);
      }
    }
  }
}
