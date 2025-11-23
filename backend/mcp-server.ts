#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://qqmilwmhvdhwvewwraci.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseKey) {
  console.error('Error: SUPABASE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Create MCP server
const server = new Server(
  {
    name: 'numnum-supabase-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'query_table',
      description: 'Query any table in the Supabase database. Can filter, sort, and paginate results.',
      inputSchema: {
        type: 'object',
        properties: {
          table: {
            type: 'string',
            description: 'Table name (e.g., restaurants, saved_restaurants, profiles)',
          },
          columns: {
            type: 'array',
            items: { type: 'string' },
            description: 'Columns to select (default: all)',
          },
          filters: {
            type: 'object',
            description: 'Filter conditions as key-value pairs',
          },
          orderBy: {
            type: 'string',
            description: 'Column to order by',
          },
          ascending: {
            type: 'boolean',
            description: 'Sort order (default: false)',
          },
          limit: {
            type: 'number',
            description: 'Limit number of results (default: 100)',
          },
        },
        required: ['table'],
      },
    },
    {
      name: 'get_table_schema',
      description: 'Get the schema/structure of a table including columns and types',
      inputSchema: {
        type: 'object',
        properties: {
          table: {
            type: 'string',
            description: 'Table name',
          },
        },
        required: ['table'],
      },
    },
    {
      name: 'list_tables',
      description: 'List all tables in the database',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'get_restaurant_stats',
      description: 'Get statistics about restaurants (total, by cuisine, top rated, etc.)',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'analyze_saved_restaurants',
      description: 'Analyze saved restaurants data (most saved, user patterns, etc.)',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ],
}));

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'supabase://tables',
      name: 'Database Tables',
      description: 'List of all tables in the Supabase database',
      mimeType: 'application/json',
    },
    {
      uri: 'supabase://restaurants',
      name: 'Restaurants Table',
      description: 'All restaurants in the database',
      mimeType: 'application/json',
    },
    {
      uri: 'supabase://saved_restaurants',
      name: 'Saved Restaurants',
      description: 'User saved restaurants',
      mimeType: 'application/json',
    },
  ],
}));

// Read resources
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === 'supabase://tables') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ 
            tables: ['restaurants', 'saved_restaurants', 'profiles', 'follows', 'posts', 'comments', 'likes'] 
          }, null, 2),
        },
      ],
    };
  }

  if (uri === 'supabase://restaurants') {
    const { data, error } = await supabase.from('restaurants').select('*').limit(50);
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ data, error: error?.message }, null, 2),
        },
      ],
    };
  }

  if (uri === 'supabase://saved_restaurants') {
    const { data, error } = await supabase.from('saved_restaurants').select('*').limit(50);
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ data, error: error?.message }, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'query_table': {
        const { table, columns, filters, orderBy, ascending = false, limit = 100 } = args as any;
        
        let query = supabase.from(table).select(columns ? columns.join(',') : '*');
        
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        
        if (orderBy) {
          query = query.order(orderBy, { ascending });
        }
        
        query = query.limit(limit);
        
        const { data, error } = await query;
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ data, error: error?.message }, null, 2),
            },
          ],
        };
      }

      case 'get_table_schema': {
        const { table } = args as any;
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        const schema = data && data.length > 0 
          ? Object.keys(data[0]).map(key => ({
              column: key,
              type: typeof data[0][key],
              sample: data[0][key],
            }))
          : [];
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ table, schema, error: error?.message }, null, 2),
            },
          ],
        };
      }

      case 'list_tables': {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                tables: ['restaurants', 'saved_restaurants', 'profiles', 'follows', 'posts', 'comments', 'likes'],
              }, null, 2),
            },
          ],
        };
      }

      case 'get_restaurant_stats': {
        const { count } = await supabase
          .from('restaurants')
          .select('*', { count: 'exact', head: true });
        
        const { data: cuisineData } = await supabase
          .from('restaurants')
          .select('cuisine');
        
        const cuisineCounts: Record<string, number> = {};
        cuisineData?.forEach(r => {
          const cuisine = r.cuisine || 'Unknown';
          cuisineCounts[cuisine] = (cuisineCounts[cuisine] || 0) + 1;
        });
        
        const { data: topRated } = await supabase
          .from('restaurants')
          .select('id, name, rating, cuisine')
          .order('rating', { ascending: false })
          .limit(5);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                total_restaurants: count || 0,
                by_cuisine: cuisineCounts,
                top_rated: topRated || [],
              }, null, 2),
            },
          ],
        };
      }

      case 'analyze_saved_restaurants': {
        const { count } = await supabase
          .from('saved_restaurants')
          .select('*', { count: 'exact', head: true });
        
        const { data: savedData } = await supabase
          .from('saved_restaurants')
          .select('restaurant_id');
        
        const restaurantCounts: Record<string, number> = {};
        savedData?.forEach(sr => {
          const rid = sr.restaurant_id;
          restaurantCounts[rid] = (restaurantCounts[rid] || 0) + 1;
        });
        
        const mostSaved = Object.entries(restaurantCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([id, count]) => ({ restaurant_id: id, save_count: count }));
        
        const { count: favoritesCount } = await supabase
          .from('saved_restaurants')
          .select('*', { count: 'exact', head: true })
          .eq('is_favorited', true);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                total_saved: count || 0,
                total_favorites: favoritesCount || 0,
                most_saved_restaurants: mostSaved,
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('NumNum Supabase MCP server running on stdin');
}

main().catch(console.error);