import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from 'src/database/prisma.service';
import { Task } from './interfaces/tasks.interface';
import { NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockClear, mockDeep } from 'jest-mock-extended';

describe('TasksService', () => {
  let service: TasksService;
  const mockPrisma: DeepMockProxy<PrismaClient> = mockDeep<PrismaClient>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    mockClear(mockPrisma);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllTasks', () => {
    it('should return all existing tasks', async () => {
      const tasks: Task[] = [
        {
          id: 1,
          title: 'test task 1',
          description: 'Simple task 1',
          done: false,
        },
        {
          id: 2,
          title: 'test task 2',
          description: 'Simple task 2',
          done: true,
        },
      ];

      mockPrisma.task.findMany.mockResolvedValue(tasks);

      const result = await service.getAllTasks();
      expect(result).toEqual(tasks);
      expect(mockPrisma.task.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return empty array if task not exist yet', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);

      const result = await service.getAllTasks();
      expect(result).toEqual([]);
      expect(mockPrisma.task.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('getOneTask', () => {
    it('should return one tasks', () => {
      const task: Task = {
        id: 1,
        title: 'test task 1',
        description: 'Simple task 1',
        done: false,
      };

      mockPrisma.task.findUniqueOrThrow.mockResolvedValue(task);

      const result = service.getOneTask({ id: task.id });

      expect(result).resolves.toEqual(task);
      expect(mockPrisma.task.findUniqueOrThrow).toHaveBeenCalledTimes(1);
      expect(mockPrisma.task.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: task.id },
      });
    });

    it('should throw NotFoundException if no user exists with id given', async () => {
      mockPrisma.task.findUniqueOrThrow.mockRejectedValue(
        new NotFoundException(),
      );

      const result = service.getOneTask({ id: 1 });

      await expect(result).rejects.toThrow(NotFoundException);

      expect(mockPrisma.task.findUniqueOrThrow).toHaveBeenCalledTimes(1);
      expect(mockPrisma.task.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('updateTask', () => {
    it('should update a task', async () => {
      const id = 1;
      const taskUpdated: Task = {
        id: 1,
        title: 'test task 1 updated',
        description: 'Simple task 1',
        done: false,
      };

      const task: Task = {
        id: 1,
        title: 'test task 1',
        description: 'Simple task 1',
        done: false,
      };

      mockPrisma.task.update.mockResolvedValue(taskUpdated);

      const result = service.updateTask({ where: { id }, data: taskUpdated });

      await expect(result).resolves.toEqual(taskUpdated);
      await expect(result).resolves.not.toEqual(task);
      expect(mockPrisma.task.update).toHaveBeenCalledTimes(1);
      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id },
        data: taskUpdated,
      });
    });

    it("should return NotFoundException when updateTask receive bad id", async () => {
      const id = 50;
      const taskUpdated: Task = {
        id: 1,
        title: 'test task 1 updated',
        description: 'Simple task 1',
        done: false,
      };
      mockPrisma.task.update.mockRejectedValue(new NotFoundException());

      const result = service.updateTask({ where: { id }, data: taskUpdated });

      await expect(result).rejects.toThrow(NotFoundException);
      expect(mockPrisma.task.update).toHaveBeenCalledTimes(1);
      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id },
        data: taskUpdated,
      });
      
    })
  });
});
