export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          code: string
          description: string | null
          earned_at: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          code: string
          description?: string | null
          earned_at?: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          code?: string
          description?: string | null
          earned_at?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      answer_options: {
        Row: {
          id: string
          is_correct: boolean
          label: string
          position: number
          question_id: string
        }
        Insert: {
          id?: string
          is_correct?: boolean
          label: string
          position?: number
          question_id: string
        }
        Update: {
          id?: string
          is_correct?: boolean
          label?: string
          position?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answer_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_courses: {
        Row: {
          active: boolean
          created_at: string
          final_test_id: string
          id: string
          pass_percent: number
          required_lessons: string[]
          skills: string[]
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          final_test_id: string
          id?: string
          pass_percent?: number
          required_lessons: string[]
          skills: string[]
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          final_test_id?: string
          id?: string
          pass_percent?: number
          required_lessons?: string[]
          skills?: string[]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_courses_final_test_id_fkey"
            columns: ["final_test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          region: string
          short_description: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          name: string
          region?: string
          short_description?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          region?: string
          short_description?: string | null
        }
        Relationships: []
      }
      company_questions: {
        Row: {
          answer: string | null
          company_id: string
          created_at: string
          difficulty: string
          explanation: string | null
          id: string
          question: string
          round_type: string
          tips: string | null
          topic: string | null
        }
        Insert: {
          answer?: string | null
          company_id: string
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          question: string
          round_type: string
          tips?: string | null
          topic?: string | null
        }
        Update: {
          answer?: string | null
          company_id?: string
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          question?: string
          round_type?: string
          tips?: string | null
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_questions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_tracks: {
        Row: {
          description: string | null
          id: string
          important_topics: string[]
          name: string
          pattern: Json
          slug: string
          sort: number
        }
        Insert: {
          description?: string | null
          id?: string
          important_topics?: string[]
          name: string
          pattern?: Json
          slug: string
          sort?: number
        }
        Update: {
          description?: string | null
          id?: string
          important_topics?: string[]
          name?: string
          pattern?: Json
          slug?: string
          sort?: number
        }
        Relationships: []
      }
      issued_certificates: {
        Row: {
          assessment_percent: number
          course_id: string
          course_title: string
          id: string
          issued_at: string
          revocation_reason: string | null
          revoked_at: string | null
          skills: string[]
          student_name: string
          user_id: string
        }
        Insert: {
          assessment_percent: number
          course_id: string
          course_title: string
          id?: string
          issued_at?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          skills: string[]
          student_name: string
          user_id: string
        }
        Update: {
          assessment_percent?: number
          course_id?: string
          course_title?: string
          id?: string
          issued_at?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          skills?: string[]
          student_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issued_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "certificate_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed: boolean
          id: string
          lesson_slug: string
          quiz_score: number | null
          quiz_total: number | null
          step: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          id?: string
          lesson_slug: string
          quiz_score?: number | null
          quiz_total?: number | null
          step?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          id?: string
          lesson_slug?: string
          quiz_score?: number | null
          quiz_total?: number | null
          step?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          aptitude_level: string
          branch: string | null
          career_interests: string[]
          coding_level: string
          college: string | null
          communication_level: string
          created_at: string
          degree: string | null
          department_group: string | null
          email: string | null
          full_name: string | null
          id: string
          improvement_areas: string[]
          learning_format: string | null
          onboarded: boolean
          points: number
          target_companies: string[]
          target_role: string | null
          year: string | null
        }
        Insert: {
          aptitude_level?: string
          branch?: string | null
          career_interests?: string[]
          coding_level?: string
          college?: string | null
          communication_level?: string
          created_at?: string
          degree?: string | null
          department_group?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          improvement_areas?: string[]
          learning_format?: string | null
          onboarded?: boolean
          points?: number
          target_companies?: string[]
          target_role?: string | null
          year?: string | null
        }
        Update: {
          aptitude_level?: string
          branch?: string | null
          career_interests?: string[]
          coding_level?: string
          college?: string | null
          communication_level?: string
          created_at?: string
          degree?: string | null
          department_group?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          improvement_areas?: string[]
          learning_format?: string | null
          onboarded?: boolean
          points?: number
          target_companies?: string[]
          target_role?: string | null
          year?: string | null
        }
        Relationships: []
      }
      progress: {
        Row: {
          attempted: number
          correct: number
          id: string
          module: string
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempted?: number
          correct?: number
          id?: string
          module: string
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempted?: number
          correct?: number
          id?: string
          module?: string
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          category: string
          company: string | null
          created_at: string
          created_by: string | null
          difficulty: string
          explanation: string | null
          hint: string | null
          id: string
          model_answer: string | null
          module: string
          prompt: string
          qtype: string
          starter_code: Json | null
          test_cases: Json | null
          time_limit_sec: number
          topic: string
        }
        Insert: {
          category: string
          company?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: string
          explanation?: string | null
          hint?: string | null
          id?: string
          model_answer?: string | null
          module: string
          prompt: string
          qtype?: string
          starter_code?: Json | null
          test_cases?: Json | null
          time_limit_sec?: number
          topic: string
        }
        Update: {
          category?: string
          company?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: string
          explanation?: string | null
          hint?: string | null
          id?: string
          model_answer?: string | null
          module?: string
          prompt?: string
          qtype?: string
          starter_code?: Json | null
          test_cases?: Json | null
          time_limit_sec?: number
          topic?: string
        }
        Relationships: []
      }
      scores: {
        Row: {
          created_at: string
          id: string
          max_score: number
          module: string
          ref_id: string | null
          score: number
          source: string
          topic: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_score: number
          module: string
          ref_id?: string | null
          score: number
          source: string
          topic?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          max_score?: number
          module?: string
          ref_id?: string | null
          score?: number
          source?: string
          topic?: string | null
          user_id?: string
        }
        Relationships: []
      }
      streaks: {
        Row: {
          current_streak: number
          last_active_date: string | null
          longest_streak: number
          user_id: string
        }
        Insert: {
          current_streak?: number
          last_active_date?: string | null
          longest_streak?: number
          user_id: string
        }
        Update: {
          current_streak?: number
          last_active_date?: string | null
          longest_streak?: number
          user_id?: string
        }
        Relationships: []
      }
      student_answers: {
        Row: {
          answer_text: string | null
          attempt_id: string | null
          created_at: string
          feedback: Json | null
          id: string
          is_correct: boolean | null
          marked_review: boolean
          question_id: string
          score: number | null
          selected_option_id: string | null
          user_id: string
        }
        Insert: {
          answer_text?: string | null
          attempt_id?: string | null
          created_at?: string
          feedback?: Json | null
          id?: string
          is_correct?: boolean | null
          marked_review?: boolean
          question_id: string
          score?: number | null
          selected_option_id?: string | null
          user_id: string
        }
        Update: {
          answer_text?: string | null
          attempt_id?: string | null
          created_at?: string
          feedback?: Json | null
          id?: string
          is_correct?: boolean | null
          marked_review?: boolean
          question_id?: string
          score?: number | null
          selected_option_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      student_projects: {
        Row: {
          completed_milestones: string[]
          demo_url: string
          id: string
          notes: string
          project_slug: string
          repository_url: string
          status: string
          summary: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_milestones?: string[]
          demo_url?: string
          id?: string
          notes?: string
          project_slug: string
          repository_url?: string
          status?: string
          summary?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          completed_milestones?: string[]
          demo_url?: string
          id?: string
          notes?: string
          project_slug?: string
          repository_url?: string
          status?: string
          summary?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_resumes: {
        Row: {
          document: Json
          job_description: string
          updated_at: string
          user_id: string
        }
        Insert: {
          document?: Json
          job_description?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          document?: Json
          job_description?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_resumes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_plans: {
        Row: {
          daily_minutes: number
          drive_date: string | null
          drive_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          daily_minutes?: number
          drive_date?: string | null
          drive_name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          daily_minutes?: number
          drive_date?: string | null
          drive_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_tasks: {
        Row: {
          category: string
          completed: boolean
          created_at: string
          due_date: string
          id: string
          minutes: number
          title: string
          user_id: string
        }
        Insert: {
          category: string
          completed?: boolean
          created_at?: string
          due_date: string
          id?: string
          minutes?: number
          title: string
          user_id: string
        }
        Update: {
          category?: string
          completed?: boolean
          created_at?: string
          due_date?: string
          id?: string
          minutes?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      test_attempts: {
        Row: {
          accuracy: number | null
          duration_sec: number
          id: string
          module: string
          question_ids: string[]
          score: number | null
          started_at: string
          submitted_at: string | null
          test_id: string | null
          time_taken_sec: number | null
          title: string
          total: number | null
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          duration_sec: number
          id?: string
          module: string
          question_ids?: string[]
          score?: number | null
          started_at?: string
          submitted_at?: string | null
          test_id?: string | null
          time_taken_sec?: number | null
          title: string
          total?: number | null
          user_id: string
        }
        Update: {
          accuracy?: number | null
          duration_sec?: number
          id?: string
          module?: string
          question_ids?: string[]
          score?: number | null
          started_at?: string
          submitted_at?: string | null
          test_id?: string | null
          time_taken_sec?: number | null
          title?: string
          total?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          active: boolean
          category: string | null
          company: string | null
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: string | null
          duration_min: number
          id: string
          kind: string
          module: string | null
          num_questions: number
          scheduled_at: string | null
          title: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          duration_min?: number
          id?: string
          kind?: string
          module?: string | null
          num_questions?: number
          scheduled_at?: string | null
          title: string
        }
        Update: {
          active?: boolean
          category?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          duration_min?: number
          id?: string
          kind?: string
          module?: string | null
          num_questions?: number
          scheduled_at?: string | null
          title?: string
        }
        Relationships: []
      }
      trainer_permissions: {
        Row: {
          assignments: boolean
          granted_by: string
          reports: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          assignments?: boolean
          granted_by: string
          reports?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          assignments?: boolean
          granted_by?: string
          reports?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      training_assignments: {
        Row: {
          completed: boolean
          created_at: string
          due_date: string
          id: string
          notes: string
          student_id: string
          title: string
          trainer_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          due_date: string
          id?: string
          notes?: string
          student_id: string
          title: string
          trainer_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          due_date?: string
          id?: string
          notes?: string
          student_id?: string
          title?: string
          trainer_id?: string
        }
        Relationships: []
      }
      training_audit: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          details: Json
          id: string
          target_id: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
        }
        Relationships: []
      }
      user_question_status: {
        Row: {
          bookmarked: boolean
          practised: boolean
          question_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bookmarked?: boolean
          practised?: boolean
          question_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bookmarked?: boolean
          practised?: boolean
          question_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_question_status_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "company_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verified_lesson_results: {
        Row: {
          completed: boolean
          id: string
          lesson_slug: string
          score: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed: boolean
          id?: string
          lesson_slug: string
          score: number
          total: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          id?: string
          lesson_slug?: string
          score?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _award: { Args: { _points: number; _uid: string }; Returns: undefined }
      _bump_progress: {
        Args: {
          _att: number
          _cor: number
          _module: string
          _topic: string
          _uid: string
        }
        Returns: undefined
      }
      attempt_review: {
        Args: { _attempt: string }
        Returns: {
          correct_option_id: string
          question_id: string
        }[]
      }
      complete_training_assignment: {
        Args: { _completed: boolean; _id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      issue_course_certificate: { Args: { _course: string }; Returns: string }
      leaderboard: {
        Args: { _limit?: number }
        Returns: {
          college: string
          current_streak: number
          full_name: string
          points: number
          rank: number
          user_id: string
        }[]
      }
      manage_course_certificate: {
        Args: { _id: string; _name: string; _reason: string }
        Returns: undefined
      }
      my_rank: { Args: never; Returns: number }
      record_activity: {
        Args: {
          _answer: string
          _feedback: Json
          _max: number
          _module: string
          _question: string
          _score: number
        }
        Returns: undefined
      }
      set_trainer_access: {
        Args: { _assignments: boolean; _reports: boolean; _target: string }
        Returns: undefined
      }
      staff_get_options: {
        Args: { _qid: string }
        Returns: {
          id: string
          is_correct: boolean
          label: string
          position: number
        }[]
      }
      start_attempt: {
        Args: {
          _category?: string
          _company?: string
          _count?: number
          _difficulty?: string
          _duration_min?: number
          _module?: string
          _test_id?: string
          _title: string
          _topic?: string
        }
        Returns: string
      }
      submit_attempt: {
        Args: { _answers: Json; _attempt: string }
        Returns: Json
      }
      training_access: { Args: { _permission: string }; Returns: boolean }
      verify_course_certificate: {
        Args: { _id: string }
        Returns: {
          course_title: string
          id: string
          issued_at: string
          revoked: boolean
          skills: string[]
          student_name: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "trainer" | "student"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "trainer", "student"],
    },
  },
} as const
